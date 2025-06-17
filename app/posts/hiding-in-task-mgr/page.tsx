import React from 'react';
import { CodeBlock, CodeSnippet, PostImage } from '@components';
import CurrentPostMeta from './meta';
import importPNG from '@assets/hiding-in-task-mgr/1imports.png';
import referencedPNG from '@assets/hiding-in-task-mgr/ntquerysysprocess.png';
import sysInfoSamplePNG from '@assets/hiding-in-task-mgr/sysinfo-properties.png';
import asmPNG from '@assets/hiding-in-task-mgr/asm.png';

const dllFilePath = 'assets/hiding-in-task-mgr/dll1.cpp';
const mainCPPPath = 'assets/hiding-in-task-mgr/main.cpp';
const injectorPath = 'assets/hiding-in-task-mgr/injector.cpp';

export default function Post() {
  return (
    <article className="mx-auto px-12 gap-10 place-content-center w-6xl">
      <div className="mt-6 text-xl leading-10">
        <h1 className="text-4xl mb-1">{CurrentPostMeta.title}</h1>
        <h3 className="text-gray-400 mb-4">
          {(new Date(CurrentPostMeta.date)).toLocaleDateString('en-us', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
        <section>
          <p>
            I was using Google Chrome for web development when it suddenly stopped responding. As usual, I opened my task manager to close that process. While I was searching for chrome.exe, these questions popped into my mind:
          </p>
          <div className="flex justify-center">
            <ol className="m-2 list-decimal">
              <li>
                Can I hide my theoretical malware from the Task Manager?
              </li>
              <li>
                Is this how game hacks evade from anti-cheat software?</li>
            </ol></div><p>I have 0 knowledge in Malware/Game Hack Development. My guess was that there is a Windows API function that is responsible for listing all processes in a system. That way, the function can be used in different applications such as the Task Manager. I opened Task Manager in Ghidra to see its imports table. </p>
          <PostImage src={importPNG.src} alt="Imports table shown in Ghidra" figureNo={1} />
          <p>
            Of course, I am not familiar with most of the DLLs listed above. I'm only familiar with user32 and kernel32 DLLs. I was pretty sure it's not in User32 because that DLL only handles Windows-GUI related functions. One by one, I expanded the DLLs to check what functions does it export (and a quick google search haha). In <CodeSnippet>ntdll.dll</CodeSnippet>, two functions caught my sight:
          </p>
          <div className="flex justify-center">
            <ol className="list-decimal m-2 w-xl">
              <li>
                <CodeSnippet>NtQueryInformationProcess</CodeSnippet> retrieves information for only a single process.
              </li>
              <li>
                <CodeSnippet>NtQuerySystemInformation</CodeSnippet> retrieves different kind of data , such as all running processes on the system, based on its first parameter SYSTEM_INFORMATION_CLASS.
              </li>
            </ol>
          </div>
          <p>To retrieve the list of running processes, you need to pass <CodeSnippet>SystemProcessInformation</CodeSnippet> class (or simply just pass '5', SystemProcessInformation is the 6th enum <a href="http://undocumented.ntinternals.net/index.html?page=UserMode%2FUndocumented%20Functions%2FSystem%20Information%2FStructures%2FSYSTEM_PROCESS_INFORMATION.html" className="underline">here</a>) as the first parameter. To confirm whether Task Manager is using this function to get the processes, I checked the cross-references to the function. Below is the second cross-reference provided by Ghidra.</p>
          <PostImage src={referencedPNG.src} alt="Cross reference to NtQuerySystemInformation" figureNo={2} />
          <p>
            Yes! It does use <CodeSnippet>NtQuerySystemInformation</CodeSnippet> and passes 5 as its first parameter! You can know more about NtQuerySystemInformation by clicking <a className="underline" href="https://docs.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntquerysysteminformation">here</a>.</p>
          <br />
          <p>
            For now, I am still unsure which part of the program uses the code snippet from above because I am still new to reverse engineering. What now?!
          </p>
        </section>
        <section className="mt-24">
          <h2 className="text-3xl mb-4 font-medium">Playing with Windows API</h2>

          <p>For this blog post, my goal was to hide notepad.exe from Task Manager.</p>
          <br />
          <p>
            The important thing is that the second argument is a pointer to a buffer, which will be overwritten by the function with linked-list-like system information. The type of system information is determined by the first argument. In this case, the system information is going to be the process information. Below is a sample of that data (SystemBasicInformation):
          </p>
          <PostImage src={sysInfoSamplePNG.src} alt="Sample of SystemBasicInformation" figureNo={3} />
          <p>
            I described it as a linked-list-like data because the NextEntryOffset property is the address relative to the next process information object. I created a loop that will use the NextEntryOffset to iterate to all process information until the NextEntryOffset is equal to zero. The ImageName property is a buffer to the name of the process. Below is a code snippet that prints all process names.
          </p>
          <CodeBlock language="cpp" codePath={mainCPPPath} lineFrom={39} lineTo={46} caption={'Listing 1. Iterating to all process information'} />
          <p>
            With some little modification, instead of printing the process name for each iteration, you can just use if-statement to compare whether the process name is notepad.exe. If it is, remove the object from the linked list. Else, do nothing. You can check linked-lists <a className="underline" href="https://www.bitdegree.org/learn/linked-list-c-plus-plus">here</a>.  That means, I need to get the next process name too. If the next process name is equal to notepad.exe, I will overwrite the current process object's NextEntryOffset with the NEXT process object's NextEntryOffset plus the CURRENT  process object's NextEntryOffset. Confusing, ain't it?
          </p>
          <CodeBlock language="cpp" codePath={mainCPPPath} lineFrom={19} lineTo={37} caption={'Listing 2. Removing chosen process name from NTSQI result'} />
        </section>
        <section className="mt-24">
          <h2 className="text-3xl mb-4 font-medium">Hooking it!</h2>
          <p>
            I now have a function (or a concept) that removes my chosen process from the list of process given by NTQSI. I just need to know how to force Task Manager to call a rogue function instead of the real one, but I am getting ahead of myself. Task Manager is a remote process. I don't even know how to do it on the current process! I should do that first.  I just know the term Windows API hooking but NO idea how to do it, just guesses. After a quick google search, I learned about Import Address Table (IAT) hooking.  <a className="underline" href="https://stackoverflow.com/questions/7673754/pe-format-iat-questions">This stackoverflow post</a> helped me understand how to get virtual addresses of Windows APIs. Basically, all Windows API functions that are imported are stored in a table allocated in a virtual address. If a process needs to call a Windows API, it can just perform a lookup on that table and get the appropriate address. If you can overwrite that address with the address of a rogue function, then function call is redirected to the rogue function instead of the legitimate one.  Currently, using listing 2 as my rogue function will not work just yet. It still needs modification because line 1 will just call itself resulting to recursion. Remember, I will change the address in the IAT, therefore, before hooking, I should store the address of the legitimate function first. To call the legitimate function, that address will be used. Below is the code snippet that will do that implements this concept.
          </p>
          <br />
          <CodeBlock language="cpp" codePath={dllFilePath} lineFrom={87} lineTo={144} caption={'Listing 3. IAT Patching'} />
          <p>
            On line 1, listing 2, I modified it to use the original NTQSI. Below is the statement of the modification.  <CodeSnippet>NTSTATUS status=((PNTQSI)OriginalNtQuerySystemInformationAddress)(SystemInformationClass, systemInformation, SystemInformationLength, ReturnLength);</CodeSnippet>. For the final step,  I just need to inject my code to a remote process! Again, no idea how to do it. After a quick google search, DLL Injection seems to be the easiest, so I decided to know more about it. In simple terms, I just need to find a way for that remote process (Task Manager, in this case) to execute  <CodeSnippet>LoadLibrary('C:/path/malicious.dll')</CodeSnippet> or something like that.  There are only 3 steps to DLL inject:</p>
          <div className="flex justify-center">
            <ol className="list-decimal m-2">
              <li>Get process handle with write permissions.</li>
              <li>Store the DLL path as string in the targeted process using that process handle.</li>
              <li>Make the targeted process execute LoadLibrary with the stored string as the argument.</li>
            </ol>
          </div>
          <p>
            Below is the code that will do the DLL injection.
          </p>
          <CodeBlock language="cpp" codePath={injectorPath} lineFrom={9} lineTo={25} caption={'Listing 4. DLL injection'} />
          <p>
            For the first step, I need to obtain the process identifier (PID) of the Task Manager. To do that, I can just use <CodeSnippet>FindWindow</CodeSnippet> method to get a handle for Task Manager window. The window handle is used in <CodeSnippet>GetWindowThreadProcessId</CodeSnippet> method to obtain PID of that window.  For the second step, you can use <CodeSnippet><a href="https://docs.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualallocex">VirtualAllocEx</a></CodeSnippet> and <CodeSnippet><a href="https://docs.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-writeprocessmemory">WriteProcessMemory</a></CodeSnippet> to manipulate memory on a remote process. The method names seem to be self-explanatory.  For the third step, you can use <CodeSnippet><a href="https://docs.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createremotethread">CreateRemoteThread</a></CodeSnippet>. Ideally, you will need to get the address of <CodeSnippet>LoadLibraryW</CodeSnippet> on the remote process, right? I honestly don't know why this works. Maybe <CodeSnippet>kernel32.dll</CodeSnippet> is always loaded on the same virtual address on all processes?  I now have an injector! I just need to put my rogue function into a DLL. Below is the main or entry point of the DLL.
          </p>
          <CodeBlock language="cpp" codePath={dllFilePath} lineFrom={28} lineTo={49} caption={'Listing 5. DLL Main'} />
          <p>For DLLs, instead of <CodeSnippet>int main()</CodeSnippet>, <CodeSnippet>DllMain()</CodeSnippet> is used as an entrypoint. When DLL is attached in a process, it runs the <CodeSnippet>Patch()</CodeSnippet> function. You can try to build a function that will unpatch the IAT when DLL is detached in the process. If you want to learn more about building a DLL, you can start <a className="underline" href="https://docs.microsoft.com/en-us/windows/win32/dlls/dllmain">here</a>.</p>
          <br />
          <p>That's it! I have built a program that will hide a process in the task manager! You can change it so that the name is based on user-input. As of now, this has already sufficed me.</p>
          <br />
          <p>I do have some questions for myself... From what I know, to call a function in Assembly Language, you must push all arguments first, then use CALL instruction. Why the assembly code below does not do that?</p>
          <PostImage src={asmPNG.src} alt="Assembly code calling NtQuerySystemInformation" figureNo={4} />
          <p>How does NtQuerySystemInformation know where are the arguments?  Also, on Listing 4, last 4 statements, why does this work? is kernel32.dll address the same for all processes?
          </p>
        </section>
      </div>
    </article>
  );
}
