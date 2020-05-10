---
title: "Creating type aliases"
date: 2020-04-13
authors: [smurthys, calebgarrick]
---

A _type alias_ is simply a new name given to an existing type, often to give a one-word name to a multi-word type. A simple example is the alias `ULONG` created for the type `unsigned long int`. Another example is the alias `std::string` that STL defines for the class `std::basic_string<char>` . \(That is, `std::string` is a short name for a specific instance of the class template `std::basic_string`.\)
<!--more-->

C++ provides three means to define type aliases: macros, typedefs, and alias declarations. This post examines the usage as well as the pros and cons of each approach. Giving away the ending, prefer "alias declarations" when creating type aliases. In fact, there is really no reason to use any means other than alias declaration.

## Macros

Describe

## `typedef` specification

Describe

## Alias declarations with `using`

Describe
