---
layout: page
title: Projects
permalink: /projects/
---

In my spare time, I like to learn new technologies or experiment with small ideas.  Below are just a few of my projects, more can be found at my [GitHub](https://github.com/williamthom-as).

# cure

##### [View GitHub Repo](https://github.com/williamthom-as/cure) 

`cure` started out as a tool that could anonymise, replace, or redact information from tabular data files for the purposes of preparing anonymised demo data. Over time, it grew into a much 
larger project that became more of a swiss-army knife for CSV data operations. It can still do things like anonymise data, but it can now also parse/extract content from complex and unorthodox 
using Excel-like named ranges, join and manipulate multiple sheets using SQL-like syntax, clean/transform data and export data to a variety of formats, including your database, (multiple) CSV sheets or even a dashboard.

If you've got an unusual/hideous CSV format (think invoices, orders etc) that you need to work with, Cure can probably handle it.

This project was also my first time writing a DSL, which was implemented instead of complex JSON/YAML templates to be more expressive.

**Languages used**: Ruby

# cure_viz

##### [View GitHub Repo](https://github.com/williamthom-as/cure-viz) 

`cure_viz` is a web app that allow for viewing and sharing interactive dashboards based on a simple template. What makes it cool is that it does not require any server-side processing, and can be run entirely in the browser.
The dashboard itself is either stored in the URL (using encoded JSON, or if its particularly large, JSONCrush format), sourced from a GitHub Gist, or uploaded to the app itself and stored in Local Storage.

Having written Cure to work with all kinds of tabular data, I wanted to be able to visualise the data in a more interactive way, at very little cost. Cure Viz came out of the desire to take a spreadsheet (or multiple),
run some analysis on it, and display those results in a dashboard that is easy to share. In the past, I would have had to export my now cleaned CSV and used a tool like Tableau, which can be expensive and time-consuming
and difficult to share publically. Since it runs entirely in a single web app, I can host it via Amazon S3 for cents a month, and I can share the URL with anyone I like.

The project was also motivated by the desire to maintain my Aurelia/UI development skills as my day job moved away from it. The project uses no CSS frameworks, and is entirely custom styled.

An example dashboard is available [here](https://xyare.com/dashboard/viewer/remote?gistId=fbbcb4ba16e3483bc66156d6c8a8dcf8).

**Languages used**: JavaScript (Aurelia), SCSS

# pg_siphon

##### [View GitHub Repo](https://github.com/williamthom-as/pg_siphon) 

`pg_siphon` is a simple proxy server that sits between your application and your Postgres server to provide *live* activity metrics on all queries executed. Sometimes, with modern ORMs and query builders, it can be difficult to see the actual queries that are being executed against your database. This can make it difficult to debug, tune, or audit your application's database activity.

Moreover, adjustments made in-code to reduce pressure on the database can be hidden in a flood of thousands of logging messages, and can be difficult to quickly quantify improvement metrics 
(eg. this code improvement saw DML queries reduced by 25% via simple caching change to prevent lookups). 

It is written in Elixir, and uses the Postgres protocol to communicate with the database and parse messages for analysis.

**Languages used**: Elixir

# block_timer

##### [View GitHub Repo](https://github.com/williamthom-as/block_timer) 

`block_timer` is a simple timing library for Ruby projects, but unlike a lot of code timers, it can be used like a stop watch to time each block of code.

**Languages used**: Ruby

# yourl-cli

##### [View GitHub Repo](https://github.com/williamthom-as/yourl-cli) 

`yourl-cli` is a simple bookmarking tool that stores and retrieves URLs from a persisted database. The application has been written with many instances of bad programming practices, allowing for buffer overflow attacks and heap overflow attacks, from both direct user input and bad files or malicious website linking. The binary is fully exploitable in 32 or 64bit, and allows for ALSR/NX etc to be enabled, or disabled depending on the difficulty level required. The `exploit` directory has only some examples of ROP-chaining exploits, there many more hidden ones.

**Languages used**: C, Python

# pal

##### [View GitHub Repo](https://github.com/williamthom-as/pal) 

`pal` is a tool that simplifies the analysis of any tabular data (think CSV files). At it's core, it is a descriptive template written to extract, manipulate, transform or report on provider billing data.

Cloud billing files are tabular data files that can get really, **really** large. So large in fact, that analysis is Excel is a pretty average experience. Moreover, whilst you can use cloud provider tools, they don't allow the easy composure, templating and sharing of reporting *ideas*. Why shouldn't I be able to design a query and run it against any billing file I like?  By templating out the reporting intelligence, the paradigm of 'write once, run many times' can be applied to your billing files. 
