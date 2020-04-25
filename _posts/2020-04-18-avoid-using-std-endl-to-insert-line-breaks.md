---
layout: default
title: "Avoid using std::endl to insert line breaks"
date: 2020-04-18
excerpt_separator: <!--excerpt-->
---

To insert a line break into an output stream, just insert the newline character (`'\n'`) instead of inserting `std::endl`. For example, write `std::cout << "hello world" << '\n';` instead of writing `std::cout << "hello world" << std::endl;`.

<!--excerpt-->

Inserting [`std::endl`](https://en.cppreference.com/w/cpp/io/manip/endl) inserts a line break and also "flushes" the output stream (ensures that data is actually written to the final destination\), which blocks the program until flushing completes. However, flushing is meaningful only with files and other kinds of streams where the final destination is some place other than main memory (a simplification, but works for our purpose\). Thus, flushing is unnecessary for destinations such as console (`std::cout`) and string streams.   

Even when flushing is required, endeavor to use the [`flush`](https://en.cppreference.com/w/cpp/io/basic_ostream/flush) function to make flushing apparent and to potentially improve performance as shown in the code example below. The comments and code are self explanatory. Obviously, the call to `flush` in function `useStream` is pointless if the output stream is `std::cout` or a string stream, but that call is made only once and thus may be acceptable.

```cpp
#include <iostream>
#include <fstream>

void useStream(std::ostream& out);

int main()
{
   char c;
   std::cout << "Choose destination: f for file; anything else for console: ";
   std::cin >> c;

   if (c == 'f')
   {
      std::ofstream f("sample.txt");
      useStream(f);
   }
   else
      useStream(std::cout);
}


//write some numbers to an output stream, inserting a linebreak after each number
void useStream(std::ostream& out)
{
   for (int i = 0; i < 6; ++i)
      out << i << '\n'; //insert line break without flushing

   out.flush(); //flush once at end (this too may be unnecessary, even for files)
}
```
---
:warning: It might seem that `if-else` statements in the example could be condensed as follows, but that
is not possible because a necessary constructor is unavailable in class`std::basic_ostream`.

```cpp
useStream(c == 'f' ? std::ofstream("sample.txt") : std::cout);
```
---

