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
provides a step-by-step exposition of the use cases and design leading up to the use of
variadic macros to meet requirements. In the process, the post also touches on the
decision (and a need) to use macros instead of function templates.

There is decidedly not much to the macros, but I chose to describe them so I can refer
to this post when I use the macros in later posts. Also, there is a lot of educational
value due to some tricky issues that need to be addressed in assembling a practical
solution. (The solution presented is not foolproof, but it is quite practical.)
<!--more-->

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Use cases

Many code examples in this blog (and elsewhere) often illustrate concepts by printing
the results of expressions along with a suitable heading. For example, Listing A shows
four lines of code (and their representative outputs) from some past posts. For
simplicity, the listing omits variable declarations. Also, Line 2 of the listing
intentionally uses `NULL` instead of `nullptr`. This choice is made for consistency with
later examples that illustrate compatibility of the macros with C++98.

---
{% include bookmark.html id="Listing A" %}

##### Listing A: use cases for print macros

```cpp
std::cout << std::strlen(z) << '\n';
std::cout << "s.data() != NULL: " << (s.data() != NULL) << '\n'; // NULL used on purpose
std::cout << "typename of a: " << typeid(a).name() << '\n';
std::cout << "duration: " << elapsed << "s\n";
```

```console
5
s.data() != NULL: true
typename of a: A10_i
duration: 0.0009001s
```

---

Each of the four lines of code in Listing A represents a different use case:

1. Print the value of an expression (`std::strlen(z)`).
2. Print an expression (`sv1.data() != NULL`) as heading and then print the value of
   that expression. This is the most common use case.
3. Print a heading (`typename of a:`) and the value of an expression (`typeid(a).name()`).
4. Print a heading (`duration:`), then the value of an expression (`elapsed`), and then
   the value of another expression (`s`).

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Initial solution

The issue with using the kind of code in Listing A is that it translates to a lot of
code. Also, in Use Case 2, it is easy to forget editing the expression in the heading
when the expression changes.

Use Cases 1, 3, and 4 are easily implemented with function templates, but that approach
too produces a lot of code; not to mention many template instantiations. Further, Use
Case 2 should be ideally satisfied by automatically generating the heading from the
expression, and that is possible only with a macro; not with a function (template).

Because Use Case 2 is satisfied only with a macro, and because the other cases are also
easily satisfied using 1-line macros, it is better to implement all cases with just
macros. Plus, the resulting macros can be easily pasted into any example code. In
contrast, function templates would be quite long and not as easy to reuse (but they do
provide better type safety; see [Exercises](#7)).

Listing B shows an initial set of function-like macros to collectively implement all
four use cases identified: one macro per use case. The listing also shows the macros
being used to print the same information printed in Listing A. The `main` function
intentionally uses C++98 features to illustrate that the macros work that far back.

**Note:** All macros are verified in C++98, C++11, C++14, and C++17 using GCC 10.1. They
are also verified in C++14 and C++17 using Visual Studio 2019 Version 16.5.5.

---
{% include bookmark.html id="Listing B" %}

##### Listing B: initial print macros ([run this code](https://godbolt.org/z/543oM5))

```cpp
#define PRINTLN(x) std::cout << (x) << '\n'
#define PRINT_XLN(x) std::cout << #x << ": " << (x) << '\n'
#define PRINT_HXLN(h,x) std::cout << (h) << ": " << (x) << '\n'
#define PRINT_HXTLN(h,x,t) std::cout << (h) << ": " << (x) << (t) << '\n'

int main() {
    std::cout << std::boolalpha;
    char z[] = "hello"; // no UIS in C++98
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
   to "stringify" the expression supplied.

3. `PRINT_HXLN(h,x) std::cout << (h) << ": " << (x) << '\n'`: This macro prints the
   result of expression `h` as heading and then prints the result of expression `x`.

4. `PRINT_HXTLN(h,x,t) std::cout << (h) << ": " << (x) << (t) << '\n'`:  This macro
   prints the result of expression `h` as heading, then prints the result of expression
   `x` and then prints the value of the tail expression `t`.

Some general points applicable to all macros:

- As the link included in the caption of Listing B shows, each macro has two variations:
  one that inserts a new line after inserting values (shown in Listing B); and one that
  does **not** insert a new line. The variant that inserts a new line has the `LN`
  suffix in its name; the other variant does not have the `LN` prefix. For example,
  `PRINTLN` and `PRINT`. In all, a total of **eight macros** are developed.

- Every expression received is parenthesized to ensure the expression is evaluated fully
  before inserting the result into the output stream.

- Each macro expands to an expression whose value is a reference to `std::cout`. Thus,
  other insertions can be chained with each invocation of the macro. For example, one
  could write the following statement:

  ```cpp
  PRINT("hello") << " world";
  ```
  
- Because each macro expands to an expression, a semi-colon is necessary to treat each
  invocation as a statement (as shown in the `main` function of Listing B). This need is
  not a limitation imposed by the macros presented, but rather a C++ requirement to
  change any function-call expression to a statement.

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Modularizing the macros

The eight macros at the link included in the caption of Listing B can be modularized so
as to increase reuse among the macros. Listing C shows the result of modularization. I
recommend using the modularized macros, instead of the initial macros in Listing B.

Although the modularization looks straightforward, the macro `PRINT_XLN` is not so. There
are three alternative ways to modularize this macro. Not surprisingly, Alternatives 1 and
2 are equivalent and produce the correct result. However, Alternative 3 does not produce
the correct result under certain circumstances.

1. `#define PRINT_XLN(x) PRINT_HXLN(#x,x)`: This is the alternative used in Listing C. It
   reuses `PRINT_HXLN` macro.

2. `#define PRINT_XLN(x) PRINT_HX(#x,x) << '\n'`: This alternative reuses the `PRINT_HX`
   macro and inserts a new line at end.

3. `#define PRINT_XLN(x) PRINT_X(x) << '\n'`: This alternative reuses the `PRINT_X` macro
   and inserts a new line at end. It fits the pattern of reuse the other new-line
   inserting macros follow, but it does **not** produce the correct result when the expression received involves a macro. The error is due to the macro in the argument
   being replaced when the `PRINT_X` macro in the replacement list is processed. See
   Exercise 3.

---
{% include bookmark.html id="Listing C" %}

##### Listing C: modularized print macros ([run this code](https://godbolt.org/z/qo6vPM))

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
be necessary to optionally send output to a different stream. This feature can be
supported using **variadic macros**, which are [function-like macros](https://en.cppreference.com/w/cpp/preprocessor/replace)
with variable number of arguments. That the macro accepts a variable number of arguments
is denoted by placing an ellipsis (`...`) after all the fixed parameters in the macro
definition. (It is acceptable for a macro to have no fixed parameters and receive only
variable number of arguments.) Then, the token `__VA_ARGS__` in the replacement list of
the macro represents the actual variable portion of the arguments passed.

The following key information applies to variadic macros:

- Variadic macros were introduced in C++11.

- Prior to C++20, the ellipsis in a macro definition stands for "one or more arguments".
  That is, at least one argument must be supplied to the variable portion of the macro's
  parameters. For example, invoking the variadic macro `F(x,...)` requires at least two
  arguments: one for the fixed parameter `x`; another for the variable part.

- Since C++20, the ellipsis in a macro definition stands for "zero or more arguments".
  That is, arguments to the variable portion are optional. For example, the variadic
  macro `F(x,...)` may be invoked with just one argument (for the fixed parameter `x`).

- Prior to C++20, both GCC and clang generate a warning if the `-pedantic` compiler
  option is set and a variadic macro is invoked without any argument for the variable
  portion. Unless warnings are treated as errors (or `-pedantic` is not used), the code
  compiles successfully.

- Prior to C++20, Visual Studio 2019 Version 16.5.5 successfully compiles if a variadic
  macro is invoked without any argument for the variable portion. [I could not find any
  complier option related to this issue in the Visual Studio documentation.]

Listing D shows the use of variadic macros to optionally set the output stream. This
version of the macros is made possible by three things:

- modular organization of the macros in Listing C;

- function `ostream` which simply returns the stream reference it receives, returning
  `std::cout` by default if no argument is supplied;

- passing `__VA_ARGS__` as the argument to function `ostream`, which has the effect of
  using `std::cout` if `__VA_ARGS__` is empty, and using `__VA_ARGS__` as the stream if
  an argument is supplied.

---
{% include bookmark.html id="Listing D" %}

##### Listing D: variadic print macros ([run this code](https://godbolt.org/z/1seYfx))

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
    PRINTLN(std::strlen(z));                          // default std::cout

    std::ostringstream str_out;
    PRINT_XLN(s.data() != NULL, str_out);             // send to string stream
    PRINTLN(str_out.str());                           // default std::cout

    PRINT_HXTLN("duration", elapsed, 's', std::cerr); // send to std::cerr
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
