---
title: "C++ Resources"
---

### The standard

* [N4659: Final working draft of C++17](https://timsong-cpp.github.io/cppwp/n4659/) \(voted by ISO as the C++17 standard\). **Recommended for linking**
* **Very large PDF file:** [N4659: Final working draft of C++17](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/n4659.pdf) 
* [Current working draft](https://eel.is/c++draft/) \(exercise caution when consulting\)
* [GitHub repo](https://github.com/cplusplus/draft/tree/master/papers) with working drafts of C++ Standard
* [C++11 FAQ](http://www.stroustrup.com/C++11FAQ.html) \(old, but gold\)
* [C++ Reference](http://en.cppreference.com/) \(unofficial, but quite accurate\)
* [Support for C++ Standard in various compilers](http://en.cppreference.com/w/cpp/compiler_support)

### Compilers

* [GCC, the GNU Compiler Collection](http://gcc.gnu.org/)
* [Clang](https://clang.llvm.org/)
* [Visual C++](https://docs.microsoft.com/en-us/cpp/cpp/c-cpp-language-and-standard-libraries)
* [Get Started](https://isocpp.org/get-started) \(also lists online compilers\)

### Online compilers

* [Compiler Explorer](https://godbolt.org/)
  * [GCC \(x86-64 trunk\) -std=c++17 -Wall -Wextra](https://godbolt.org/z/8mz45V)
  * [Clang \(x86-64 trunk\) -std=c++17 -Wall -Wextra](https://godbolt.org/z/swmTOD)
  * [MSVC \(x86 19.24\) /std:c++17](https://godbolt.org/z/yfZ2xK) \(with many warnings enabled\)
* [Wandbox](https://wandbox.org/): Select `Don't Use Boost` and set "language" to `C++17`

All the links above configure the compiler to report most warnings, but none asks the compiler to treat warnings as errors. This choice is made so that the distinction between errors and warnings remains apparent. However, it is important to **treat every warning as an error**, and ignore warnings only consciously. 

Many other online compiler services are available \(see [a list](https://arnemertz.github.io/online-compilers/)\), but most have limitations with respect to compiler version, language standard, and other key factors. However, no matter which online service you use, make sure it uses a relatively new version of GCC, Clang, or MSVC. Also make sure the service supports C++17, and that you set the service to use C++17.

**Note:** Compiler Explorer does not support execution for MSVC. Please review the status of this [issue](https://github.com/mattgodbolt/compiler-explorer/issues/1502) and let us know if the situation has changed so we can update the compiler link above. 

### Online resources

* [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
* [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
* [More C++ Idioms](https://en.wikibooks.org/wiki/More_C%2B%2B_Idioms)
* [CodeStepByStep](https://www.codestepbystep.com/problem/list/cpp)

### Books

* Programming Principles and Practice Using C++; 2nd edition; Bjarne Stroustrup; Addison Wesley Publications
* [List of books](https://accu.org/index.php?module=bookreviews&func=browse) \(with reviews\)

