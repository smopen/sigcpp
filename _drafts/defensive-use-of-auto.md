---
layout: default
title: "Defensive use of auto"
date: 2020-04-15
excerpt_separator: <!--more-->
---

Receiving a collection as a function parameter and iterating over the received collection is a 
common programming idiom. This idiom is not unique to C++, but C++ STL can present unique challenges 
in this context. This post specifially examines some issues and choices for loop variables when 
traversing a collection, and the impact the choices could have on the function's correctness, 
maintainability, and standards-compliance.

For the curious, this post analyzes the issues and choices related to just one line of code in a 
50-line representative program that illustrates a common application need.

<!--more-->

### Application scenario

Consider the task of processing command-line arguments a program may have received. In this situation,
a common approach is for the `main` function to pass the arguments to a function such as 
`process_args`, with the arguments likely transformed to a vector or other collection (instead of
passing an array of `char` pointers).

For simplicity, assume the program supports three command-line options  `-h`, `-q`, and `-s`. Also 
assume that the command-line may ispecify any or all three options, and the options may appear in any
order. Lastly, if the command-line specifies an option, it should also specity a value for that 
option immediately after the option specifier. For example, it is not necessary to specify the `-h`
option, but if `-h` is specified, a value should also be specified for that option.

For the purpose of this post, assume the `-h` option specifies a flag to denote if the program should
print a header; `-q` specifies a "quantity" of some thing the program needs; and `-s` specifies the 
kind of summary the program should print.

Table 1 shows some example command-lines in the syntax just described above. In the examples, the 
executable is assumed to be in the file `driver.exe`. Listing A shows a possible implementation of 
a program whose command-line has the syntax just described. 

Here are the results of running the program in Listing A with some of the command-lines shown in 
Table 1:

```console
C:\>driver.exe
Header: true; Quantity: 1; Summary: detail

C:\>driver.exe -h no
Header: false; Quantity: 1; Summary: detail

C:\>driver.exe -q 7 -s none
Header: true; Quantity: 7; Summary: none

C:\>driver.exe -s detail -h no -q 10
Header: false; Quantity: 10; Summary: detail
```


**Table 1: Sample command-lines**

|Command-line                          |Description|
|:------------------------------------|:----------|
|`driver.exe`                        | Just the program name on the command-line, no options|
|`driver.exe -h no`                  | Only option `-h`|
|`driver.exe -q 7 -s none`          | Only options `-q` and `-s`, `-q` specified first |
|`driver.exe -s basic -q 7`         | Only options `-q` and `-s`, `-s` specified first |
|`driver.exe -h no -s detail -q 10`| All three options specified |
|`driver.exe -s detail -h no -q 10`| All three options specified |


---
**Listing A** ([Compiler Explorer](https://godbolt.org/z/CqZBa4))
```cpp
#include <iostream>
#include <vector>
#include <string_view>
#include <string>
#include <tuple>
#include <cstddef>
#include <cstdlib>

std::tuple<bool, long, std::string> process_args(std::vector<std::string_view> args);

int main(int argc, char* argv[]) 
{
    //build a vector with parts of the cmd-line received
    std::vector<std::string_view> args;
    for(int i = 0; i < argc; ++i)
        args.emplace_back(argv[i]);

    //retrieve options received on the cmd-line: defaults returned for missing options
    bool h;
    long q;
    std::string s;
    std::tie(h, q, s) = process_args(args); 

    //do the program's business using options retrieved
    //...
    
    //for illustration, print the options retrieved
    std::cout << std::boolalpha 
              << "Header: " << h 
              << "; Quantity: " << q 
              << "; Summary: " << s << '\n';
}


//extract options from cmd-line; use default values for options not specified on cmd-line
std::tuple<bool, long, std::string> process_args(std::vector<std::string_view> args)
{
    //variables to capture options specified, initializing each var with apt default value
    bool header { true };
    long quantity { 1 };
    std::string summary { "detail" };

    //skip args[0] because that is guaranteed to the the program file path
    //test only args[1], args[3], args[5],... because that is the cmd-line syntax
    //the for-loop header is the main focus of this analysis
    for (std::size_t i = 1; i < args.size(); i+=2)
        if (args[i] == "-h")
            header = args[i+1] == "yes";
        else if (args[i] == "-q")
            quantity = std::strtol(args[i+1].data(), nullptr, 10);
        else if (args[i] == "-s")
            summary = args[i+1];

    return std::make_tuple(header, quantity, summary);
}
```
---


### Analysis

The rest of this post focuses on the issues and choices related to the for-loop header in function 
`process_args`.

