#include "Winternl.h"
#include "windows.h"
#include <iostream>
#include <wchar.h>

int main() {
  NTSTATUS status;
  PVOID buffer;
  ULONG bufferSize;

  NtQuerySystemInformation(SystemProcessInformation, NULL, NULL, &bufferSize);

  buffer =
      VirtualAlloc(NULL, bufferSize, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
  PSYSTEM_PROCESS_INFORMATION systemInformation =
      (PSYSTEM_PROCESS_INFORMATION)buffer;
  ULONG offsetToHideProcess = 0;
  LPBYTE firstSystemInformation = (LPBYTE)systemInformation;
  status = NtQuerySystemInformation(SystemProcessInformation, systemInformation,
                                    bufferSize, NULL);
  if (NT_SUCCESS(status)) {
    while (systemInformation->NextEntryOffset) {
      PSYSTEM_PROCESS_INFORMATION nextProcessInformation =
          PSYSTEM_PROCESS_INFORMATION(systemInformation->NextEntryOffset +
                                      (LPBYTE)systemInformation);
      if (wcscmp(nextProcessInformation->ImageName.Buffer,
                 L"PracticeNTQSI.exe") == 0) {
        offsetToHideProcess =
            offsetToHideProcess + systemInformation->NextEntryOffset;
        systemInformation->NextEntryOffset =
            nextProcessInformation->NextEntryOffset +
            systemInformation->NextEntryOffset;
      }
      systemInformation =
          (PSYSTEM_PROCESS_INFORMATION)(systemInformation->NextEntryOffset +
                                        (LPBYTE)systemInformation);
    }
    systemInformation = (PSYSTEM_PROCESS_INFORMATION)firstSystemInformation;
    while (systemInformation->NextEntryOffset) {
      if (systemInformation->ImageName.Buffer != NULL) {
        printf("%ws\n", systemInformation->ImageName.Buffer);
      }
      systemInformation =
          (PSYSTEM_PROCESS_INFORMATION)(systemInformation->NextEntryOffset +
                                        (LPBYTE)systemInformation);
    }
  }

  return 1;
}
