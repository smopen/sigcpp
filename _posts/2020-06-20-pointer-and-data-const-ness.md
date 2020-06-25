---
pid: 7
title: "Pointer and data const-ness"
date: 2020-06-20
authors: smurthys
cpp_levels: [intermediate, esoteric]
reader_activity: exercises
---

This post discusses the effect of `const` qualification in pointer declarations,
specifically the difference between `const`ness of pointer and `const`ness of data. It
first examines `const` qualification in non-array pointer declarations, and then
the qualification in the context of arrays. In both cases, it discusses declarations of
variables, function parameters, and function return types. The post assumes the reader
is familiar with pointers, the relationship between arrays and pointers, and arrays
decaying to pointers.

But first, some advice: Avoid using pointers (directly), and instead use references. Also
prefer `std::array` over traditional arrays. However, there are situations where
pointers and traditional arrays are the only/better choice and in those cases use `const`
qualification correctly to maximize safety.
<!--more-->

**Note:** All examples in this post are verified in C++17 using both GCC 10.1 and Visual
Studio 2019 Version 16.5.5.

{% include bookmark.html id="1" %}

### 1.&nbsp;&nbsp; Pointers to non-array data

This section discusses the distinction between `const`ness of pointer and `const`ness of
data that is not a traditional array. "Non-array pointers" includes pointers to
fundamental types (such as `char` and `int`) and objects, including container objects
such as vectors, lists, and maps.

There are four permutations of pointer `const`ness and data `const`ness, and each
permutation is due to a specific form of declaration based on where the keyword `const`
is placed. Listing A illustrates the four forms with a separate pointer variable
declared using each form.

**Note:** The `const` keyword in a variable declaration is part of what is called the
[_cv-qualifier-sequence_](https://timsong-cpp.github.io/cppwp/n4659/dcl.ptr#1).

---

##### Listing A: declaration forms of non-array pointers ([run this code](https://godbolt.org/z/T6i5LM))


```cpp
int main() {
    int a{ 5 }, b{ 8 };

    int* p1 = &a;              // variable ptr, variable data
    p1 = &b;                   // change ptr
    *p1 = 7;                   // change data; b = 7

    const int* p2 = &a;        // variable ptr, const data
    p2 = &b;                   // change ptr
    *p2 = 7;                   // error: can't change const data

    int* const p3 = &a;        // const ptr, variable data
    p3 = &b;                   // error: can't change const ptr
    *p3 = 9;                   // change data; a = 9

    const int* const p4 = &a;  // const ptr, const data
    p4 = &b;                   // error: can't change const ptr
    *p4 = 7;                   // error: can't change const data
}
```

---

The `const`ness permutations and their corresponding declaration forms shown in Listing A
are:

1. `int* p1`: `p1` can be assigned the address of any `int`, and it can be used to
   modify the value of the `int` to which it points at the time of modification. `p1` can point to any number of `int`s over its lifetime.

   Read this declaration as "pointer to `int`".

   This form is most common for variable declarations. It may also be used for a function
   parameter if the function is to cause a side effect (that is, dereference the pointer
   to modify data).

2. `const int* p2`: `p2` can be assigned the address of any `int`, but it **cannot** be
   used to alter the value of the `int` to which it points. Like `p1`, `p2` can point to any number of `int`s over its lifetime.

   Read this declaration as "pointer to `const int`". That is, the `int` pointed to is
   constant; the pointer itself is not.

   This form is rare for variable declarations, but is quite common for array parameters
   where the function guarantees it does **not** modify the argument passed. For example,
   [`std::size_t strlen(const char* s);`](https://en.cppreference.com/w/cpp/string/byte/strlen)

3. `int* const p3`: `p3` can be initialized with the address of only one `int` ever (and
   only at declaration), but it **can** be used to modify the value of the `int` to which it points. `p3` can point to only one `int` over its lifetime.

   Read this declaration as "`const` pointer to `int`". That is, the `int` pointed to is **not** constant; but the pointer is constant.

   This form is rare for scalar variables or parameters, and it is unnecessary for
   scalars because references provide an elegant alternative (a reference variable must
   be initialized at declaration and its binding cannot change after initialization).
   For example, use `int& r = i;` instead of `int* const r = &i;`. Likewise, receive
   function parameters by reference as in `void trim(std::string& s);`

   This form could potentially be useful to store the address of dynamically-allocated
   data to ensure that the pointer is not overwritten, perhaps to ensure that the address
   is available for freeing memory later. Example usage: `int* const p = new int;`

4. `const int* const p4`: `p4` can be initialized with the address of only one `int` ever
   (at declaration), and it **cannot** be used to alter the value of the `int` to which
   it points. Like `p3`, `p4` can point to only one `int` over its lifetime.

   Read this declaration as "`const` pointer to `const int`". That is, the `int` pointed to is constant; and the pointer is also constant.

   This form too is rare for scalar variables or parameters, and it is better to use
   `const` references instead. For example, use `const int& r = i;` instead of using
   `const int* const r = &i;`. In fact, functions routinely use `const` references to
   efficiently receive objects and assure that there are no side effects. For example,
   `int compare(const std::string& s);`

   This form too can be useful to store the address of dynamically-allocated data, where
   neither the pointer nor the data is to be altered after initialization.

**Note**: Forms 3 and 4 (where the pointer is `const`) are unnecessary for parameter
declarations because Forms 1 and 2 already guarantee that any change the called function
makes to the pointer parameter does not affect the corresponding argument in the called
function. This guarantee is due to the pointer (that is the address) being passed by
value. Study [this program](https://godbolt.org/z/uhM3mT) prepared to illustrate the
declarations forms of non-array pointer parameters.

**Advice:** Strive to use references instead of pointers for both variables and
parameters.

{% include bookmark.html id="2" %}

### 2.&nbsp;&nbsp; Function return types

All four forms of pointer declarations listed in Section 1 may be used as function
return types, but the compiler [ignores](https://timsong-cpp.github.io/cppwp/n4659/dcl.fct#7)
the `const` qualification of the pointer in Forms 3 and 4. That is, effectively, only
Forms 1 and 2 are relevant to function return types.

The reason compilers ignore pointer `const`ness in the return type is because it is
up to the calling function to determine that `const`ness. (Compilers similarly ignore
data `const`ness in the return type when a function returns a fundamental type. See
Exercise 1.)

Listing B shows the use of the four forms of pointer return types and calls out places
where pointer `const`ness is ignored.

---

##### Listing B: forms of pointer return types ([run this code](https://godbolt.org/z/T2lyxV))

```cpp
int* f1() {
    return new int { 1 };
}

const int* f2() {
    return new int { 2 };
}

int* const f3() {          // ptr const qual ignored; returns int*
    return new int { 3 };
}

const int* const f4() {    // ptr const qual ignored; returns const int*
    return new int { 4 };
}

int main() {
    auto p1 = f1(); // type: int*
    auto p2 = f2(); // type: const int*
    auto p3 = f3(); // expected type: int* const; actual: int*
    auto p4 = f4(); // expected type: const int* const; actual: const int*

    //omit: save variables p1-p4 for later deleting

    p1 = p3;        // change ptr
    *p1 = 6;        // change data

    p2 = s1;        // change ptr
    *p2 = 6;        // can't change const data

    //omit: p3 and p4 behave as p1 and p2, respectively
    //omit: free dynamically-allocated ints using saved ptrs
}
```

---

{% include bookmark.html id="3" %}

### 3.&nbsp;&nbsp; Pointers to arrays

Pointer declarations are relevant in the context of traditional arrays because every
array "decays" to a pointer. For example, if `a` is an array of `int` values, then the
type of `a` decays to `int*`. In other words, the type of `a` is compatible with or is
practically the same as `int*`. 

The decaying of array to a pointer includes `const` qualification of data. For example,
if `a` is an array of `const int` values, then the type of `a` reduces to `const int*`. Note that the `const` qualification is on data; not on the pointer.

Following the decay principle, it is possible to assign an array name to a variable of
its decay type and place any of the four `const`ness permutations on the variable with
the same semantics described in Section 1 (and illustrated in [Listing A](#listing-a)).

Array decay types are useful (and required) to receive array parameters, but as with
non-array pointers, the use of the types with pointer `const`ness is uncommon. Study
[this program](https://godbolt.org/z/MD2Mgj) prepared to illustrate `const`
qualification on an array's decay types.

Array decay types with and without `const` qualification on data are frequently used with
[C-strings]( {{ '/2020/03/30/exploring-c-strings' | relative_url }} ), which are just
`char` arrays. For example, the library function [`std::strcpy`](https://en.cppreference.com/w/cpp/string/byte/strcpy)
receives the destination array as `char*` so that the destination can be modified, but
receives the source array as `const char*` because the source is only read.  

{% include bookmark.html id="4" %}

### 4.&nbsp;&nbsp; Pointers to arrays of pointers

This section discusses the somewhat esoteric topic of `const`ness of pointers to arrays
of pointers, the kind of data that a program receives on the command line. Consequently,
the examples in this section use arrays of C-strings, which are simply arrays of `char`
pointers. However, the discussion applies to arrays of pointers to data of any type.

**Note:** It is generally better to transform C-strings into `std::string` or
[`std::string_view`]( {{ '/2020/04/03/efficiently-processing-immutable-text' | relative_url }} )
objects, and if necessary, collect those objects in a container such as `std::vector`.
However, there are situations where it is better to work with C-strings and arrays of
C-strings. In those situations, take care to access only the portions of memory that are
allocated for the data with which you are working.  

A C++ program is able to receive command-line arguments by defining a `main` function of
the form `int main(int argc, char** argv)`, where `argc` is the number of arguments
received and `argv` is a [pointer to pointer to `char`](https://timsong-cpp.github.io/cppwp/n4659/basic.start.main#2.2). However, based on the array decay principle, this
form of `main` can also be declared as `int main(int argc, char* argv[])`, where `argv`
is an array of `char` pointers.

Given that an array of C-strings could be modeled either as an array of `char` pointers
(say `char* argv[]`) or as a pointer to pointer to `char` (say `char** argv`), it helps
to understand the impact of `const` qualifications in each case. The following is a
summary of the effect of `const` qualifications in the two cases, assuming the parameter
is named `argv`.

Note that in either case, if any permutation permits altering pointers to C-strings or
the characters in C-strings, such alteration would have side effect. However, if a
permutation permits modification to `argv` itself, any such modification would **not**
have side effect.

#### When the parameter is an array of `char` pointers

All permutations in this case permit modification of `argv` itself, and that
modification would **not** have side effect.

1. **`char* argv[]`:** Nothing is `const`. The characters in the C-strings and the
   pointers to C-strings may be modified.

2. **`const char* argv[]`:** The characters in the C-strings are `const`, but the
   pointers to C-strings are not.

3. **`char* const argv[]`:** The characters in the C-strings are modifiable, but the
   pointers to C-strings are `const`.

4. **`const char* const argv[]`:** Both the characters in the C-strings and the pointers
   to C-strings are `const`.

#### When the parameter is a pointer to pointer to `char`

All permutations in this case permit modification of pointers to C-strings, but any such
modification would have side effect. Where `argv` itself is modifiable, that modification
would **not** have side effect.

1. **`char** argv`:** Nothing is `const`. The characters in the C-strings and `argv`
   itself may be modified.

2. **`const char** argv`:** The characters in the C-strings are `const`, but `argv` is
   not.

3. **`char** const argv`:** The characters in the C-strings are modifiable, but `argv` is
   `const`.

4. **`const char** const argv`:** Both the characters in the C-strings and `argv` are
   `const`.

Listing C shows some code to illustrate the effect of each `const`ness permutation in
both cases. The code assumes that the parameter is passed an array of at least two
C-strings and that the first C-string has at least one non-null character in it. The
code at the link included in the listing's caption has additional comments.

---

##### Listing C: forms of pointer to array of pointers ([run this code](https://godbolt.org/z/SDnoCB))

{% include multi-column-start.html c=1 h="Array of `char` pointers" %}

```cpp
void g1(char* argv[]) {
    *argv[0] = '1';
    argv[1] = "-1";
    ++argv;
}

void g2(const char* argv[]) {
    *argv[0] = '2'; // error: const data
    argv[1] = "-2";
    ++argv;
}

void g3(char* const argv[]) {
    *argv[0] = '3';
    argv[1] = "-3"; // error: const ptr
    ++argv;
}

void g4(const char* const argv[]) {
    *argv[0] = '4'; // error: const data
    argv[1] = "-4"; // error: const ptr
    ++argv;
}
```

{% include multi-column-start.html c=2 h="Pointer to pointer to `char`" %}

```cpp
void g1(char** argv) {
    **argv = '1';
    *(argv+1) = "-1";
    ++argv;
}

void g2(const char** argv) {
    **argv = '2';   // error: const data
    *(argv+1) = "-2";
    ++argv;
}

void g3(char** const argv) {
    **argv = '3';
    *(argv+1) = "-3";
    ++argv;         // error: const ptr
}

void g4(const char** const argv) {
    **argv = '4';   // error: const data
    *(argv+1) = "-4";
    ++argv;         // error: const ptr
}
```

{% include multi-column-end.html %}

{% include bookmark.html id="5" %}

### 5.&nbsp;&nbsp; Summary

In summary, C-strings and NTBSs are different with respect to the number of null character
occurrences permitted and the required location of the null character. However, I have yet
to encounter any situation where this subtlety causes an issue: If an array with multiple
null characters or a misplaced null character is used where an NTBS is expected, only the
portion of the array until the first occurrence of the null character is processed. That
is, in practice, an NTBS is treated just as a C-string.

{% include bookmark.html id="6" %}

### 6.&nbsp;&nbsp; Exercises
