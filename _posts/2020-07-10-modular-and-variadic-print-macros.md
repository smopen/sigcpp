---
pid: 8
title: "Modular and variadic print macros"
date: 2020-07-10
authors: smurthys
cpp_level: introductory
cpp_versions: "Any C++"
reader_activity: exercises
---

This post documents some macros I routinely use when experimenting with code. It presents
the use cases for the macros and provides a step-by-step exposition of the design leading
up to the use of variadic macros. In the process, the post also touches on the decision
(and a need) to use macros instead of function templates.

There is decidedly not much to the macros, but I chose to describe them so I can refer
to this post when I use the macros in code examples in later posts. It helps to note that
the macros are **not** foolproof, and there is no goal to make them so.
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Use cases

Many code examples in this blog (and elsewhere) often show results of expressions by
printing the results with a suitable heading. For example, Listing A shows four lines of
code (and representative outputs) from some past SIGCPP posts:

---
{% include bookmark.html id="Listing A" %}

##### Listing A: example printing patterns and results (variable declarations omitted)

```cpp
std::cout << std::strlen(z) << '\n';
std::cout << "s.data() != nullptr: " << (s.data() != nullptr) << '\n'
std::cout << "typename of a: " << typeid(a).name() << '\n';
std::cout << "duration: " << elapsed << "s\n";
```

```console
5
s.data() != nullptr: true
typename of a: A10_i
duration: 0.0009001s
```

---

Each of the four lines of code in Listing A represents a different use case:

1. Print the value of an expression (`std::strlen(s8)`).
2. Print an expression (`sv1.data() == nullptr`) as heading and then print the value of
   that expression. This is the most common use case.
3. Print a heading (`typename of a:`) and the value of an expression (`typeid(a).name()`).
4. Print a heading (`string_view:`), then value of an expression (`elapsed.count()`),
   and then print the value of another expression (`s`).

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Solution

The issue with using the kind of code shown is that it translates to a lot of code. Also,
in Use Case 2, it is easy to forget editing the expression in the heading when the
expression changes.

Use cases 1, 3, and 4 are easily implemented with function templates, but that approach
also produces a lot of code; not to mention template instantiation. Use Case 2 should be
ideally satisfied by automatically generating the heading from the expression, and that
is possible only with a macro; not with a function (template).

Because Use Case 2 is satisfied only with a macro, and because the other cases are also
easily satisfied using 1-line macros, it is better to implement all cases with just
macros. Plus, the resulting macros can be easily pasted into any example code. In
contrast, function templates would be quite long and not as easy to reuse (but they do
provide better type safety; see [Exercises](#7)).

Listing B shows an initial version of macros to collectively implement all four use
cases identified: one macro per use case. The listing also shows the macros being used
to print the same information printed by the code in Listing A.

**Note:** All macros are verified in C++98, C++11, C++14, and C++17 using GCC 10.1. They
are also verified in C++14 and C++17 using Visual Studio 2019 Version 16.5.5.

The `main` function in Listing B intentionally uses C++98 features to verify that the
macros work that far back.

---
{% include bookmark.html id="Listing B" %}

##### Listing B: initial macros to satisfy the use cases identified ([run this code](https://godbolt.org/z/jbEEaG))

```cpp
#define PRINTLN(x) std::cout << (x) << '\n'
#define PRINT_XLN(x) std::cout << #x << ": " << (x) << '\n'
#define PRINT_HXLN(h,x) std::cout << (h) << ": " << (x) << '\n'
#define PRINT_HXTLN(h,x,t) std::cout << (h) << ": " << (x) << (t) << '\n'

int main() {
    std::cout << std::boolalpha;
    char s[] = "hello"; // no UIS in C++98
    std::string s;
    int a[10];
    double elapsed = 0.0009001;

    // the following four lines correspond to the four code lines in Listing A
    PRINTLN(std::strlen(z));
    PRINT_XLN(s.data() != NULL); // no constant nullptr in C++98
    PRINT_HXLN("typename of a", typeid(a).name());
    PRINT_HXTLN("duration", elapsed, 's');
}
```

---

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Solution details

Here is a brief note on each of the four macros:

1. `PRINTLN(x) std::cout << (x) << '\n'`: This macro simply prints the value of an
   expression.

2. `PRINT_XLN(x) std::cout << #x << ": " << (x) << '\n'`: This macro prints an expression
   as the heading and then prints the value of the expression. It uses the [# operator](https://en.cppreference.com/w/cpp/preprocessor/replace#.23_and_.23.23_operators)
   to "stringify" the expression supplied .

3. `PRINT_HXLN(h,x) std::cout << (h) << ": " << (x) << '\n'`: This macro prints the
   result of expression `h` as heading and then prints the result of expression `x`.

4. `PRINT_HXTLN(h,x,t) std::cout << (h) << ": " << (x) << (t) << '\n'`:  This macro
   prints the result of expression `h` as heading, then prints the result of expression
   `x` and then prints the value of expression `t`.

Some general points applicable to all macros:

- As the link included in the caption of Listing B shows, each macro has two versions:
  one that inserts a new line after inserting values; and one that does **not** insert a
  new line. The version that inserts a new line has the `LN` suffix in its name; the
  other version does not have the `LN` prefix. For example, `PRINTLN` and `PRINT`.

- Every expression received is parenthesized to ensure the expression is evaluated fully
  before inserting the result into the output stream.

- Each macro expands to an expression whose value is a reference to the output stream
  into which data is inserted. Thus, other insertions can be chained with each invocation
  of the macro. For example, one could write the following statement:

  ```cpp
  PRINT("hello") << " world";
  ```
  
- Because each macro expands to an expression, a semi-colon is necessary to treat each
  invocation as a statement (as shown in Listing B). This need is not a limitation
  imposed by the macros, but rather a C++ requirement to change any function-call
  expression to a statement.

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Modularizing the macros

The eight macros at the link included in the caption of Listing B can be modularized so
as to increase reuse among the macros. Listing C shows the result of modularization. I
recommend using the modularized macros (instead of the ones in Listing B).

**Note:** The modularization is Listing C is possible mainly due to each macro expanding
to an expression.

---
{% include bookmark.html id="Listing C" %}

##### Listing C: modularized print macros ([run this code](https://godbolt.org/z/n1v51e))

```cpp
#define PRINT(x) std::cout << (x)
#define PRINT_HX(h,x) PRINT(h) << ": " << (x)
#define PRINT_X(x) PRINT_HX(#x,x)
#define PRINT_HXT(h,x,t) PRINT_HX(h,x) << (t)

#define PRINTLN(x) PRINT(x) << '\n'
#define PRINT_HXLN(h,x) PRINT_HX(h,x) << '\n'
#define PRINT_XLN(x) PRINT_HXLN(#x,x)
#define PRINT_HXTLN(h,x,t) PRINT_HXT(h,x,t) << '\n'
```

---

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Optionally setting the output stream

The macros presented thus far send output only to `std::cout`. However, sometimes it may
be necessary to optionally send output some other stream. This feature can be supported
using **variadic macros**, which are [function-like macros](https://en.cppreference.com/w/cpp/preprocessor/replace)
with variable number of arguments. That the macro accepts a variable number of arguments
is denoted by placing an ellipsis (`...`) after all the fixed parameters in the macro
definition. (It is acceptable for a macro to have no fixed parameters and receive only
variable number of arguments.) Then, the token `__VA_ARGS__` in the replacement list of
the macro represents the actual variable portion of the arguments passed.

The following key information applies to variadic macros:

- Variadic macros were introduced in C++11

- Prior to C++20, at least one argument is required for the variable portion of a macro's
  parameters. For example, invoking the variadic macro `F(x,...)` requires at least two
  arguments: one for the fixed parameter `x`; another for the variable portion. That is,
  prior to C++20, variable arguments does **not** mean optional arguments.

- Since C++20, it is not necessary to pass any argument to the variable portion. For
  example, the variadic macro `F(x,...)` may be invoked with just one argument (for the
  fixed parameter `x`).  That is, since C++20, variable arguments also means optional
  arguments.

- Prior to C++20, both GCC and clang generate a warning if the `-pedantic` compiler
  option is set and a variadic macro is invoked without any argument for the variable
  portion. Unless warnings are treated as errors, the code compiles successfully.

- Visual Studio 2019 Version 16.5.5 successfully compiles if a variadic macro is invoked
  without any argument for the variable portion. [I could not find any complier warning
  related to this issue.]

Listing D shows the use of variadic macros to optionally set the output stream. This
version of the macros is made possible by three things:

- The modular organization of the macros in Listing C

- Function `ostream` which simply returns the stream reference it receives, returning
  `std::cout` by default if no argument is supplied

- Passing `__VA_ARGS__` as the argument to function `ostream`, which has the effect of
  using `std::cout` if `__VA_ARGS__` is empty, and using `__VA_ARGS__` as the stream if
  an argument is supplied.

---
{% include bookmark.html id="Listing D" %}

##### Listing D: optionally setting the output stream ([run this code](https://godbolt.org/z/vn76xn))

```cpp
inline std::ostream& ostream(std::ostream& o = std::cout) { return o; }

#define PRINT(x,...) ostream(__VA_ARGS__) << (x)
#define PRINT_HX(h,x,...) PRINT(h,__VA_ARGS__) << ": " << (x)
#define PRINT_X(x,...) PRINT_HX(#x,x,__VA_ARGS__)
#define PRINT_HXT(h,x,t,...) PRINT_HX(h,x,__VA_ARGS__) << (t)

#define PRINTLN(x,...) PRINT(x,__VA_ARGS__) << '\n'
#define PRINT_HXLN(h,x,...) PRINT_HX(h,x,__VA_ARGS__) << '\n'
#define PRINT_XLN(x,...) PRINT_HXLN(#x,x,__VA_ARGS__)
#define PRINT_HXTLN(h,x,t,...) PRINT_HXT(h,x,t,__VA_ARGS__) << '\n'

int main() {
    PRINTLN(std::strlen(z));                          // std::cout by default

    std::ostringstream str_out;
    PRINT_XLN(s.data() != NULL, std::cerr);           // force to string stream
    PRINTLN(str_out.str());                           // std::cout by default

    PRINT_HXTLN("duration", elapsed, 's', std::cerr); // force to std::cerr
}
```

---

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Summary


{% include bookmark.html id="7" %}

### 7.&nbsp;&nbsp; Exercises

1. Following the discussion in [Section 3](#3), does the following macro chain compile
   successfully? If yes, what does the program print? If the code does not compile,
   illustrate the issue with a code segment directly using `std::cout`, **without**
   using any of the `PRINT` macros.

   ```cpp
   PRINT("hello") << PRINT(" world");
   ```
