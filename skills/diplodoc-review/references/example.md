# Worked review: conditions and missing knowledge

This example uses the research's synthetic DocuBox domain. It is not a claim
about a production product. The contract here is complete for the chosen tasks.

## Inputs

Task: import a file, decide whether Exact processing is allowed, then export
without specifying a format.

Contract:

- The default profile is Standard.
- General import is allowed up to 512 MB inclusive; `.vec` has a stricter
  256 MB inclusive limit.
- Exact processing has a separate 256 MB inclusive limit.
- Default export is NOVA regardless of profile, level or protected mode.

Candidate:

> With no explicit profile, use Standard. All file types, including `.vec`,
> can be imported up to 512 MB. Once imported, any file can use Exact.
> Import a 400 MB `.dbx`, select Exact and export without specifying a format.

## Useful review

Changes are needed for the import/process/export task. Three substantive
findings are supported by the supplied contract:

1. **Confirmed defect: `.vec` exception contradicted.** The candidate's
   "including `.vec`" promise permits files above the actual 256 MB limit.
   Restore the stricter exception and its inclusive boundary. General 512 MB
   import remains valid for other file types.
2. **Confirmed defect: import and processing eligibility conflated.**
   "Once imported, any file can use Exact" contradicts Exact's separate
   limit. The 400 MB `.dbx` example imports successfully but fails Exact.
   Explain the second check and correct the example. These are two locations
   of the same underlying rule error, not two independent quality dimensions.
3. **Coverage gap: the default export result is unspecified.** The no-format
   export task requires knowing the NOVA default. Add that rule and its scope.
   No current statement explicitly contradicts it; this is missing knowledge.

The Standard default is correct. The supplied contract establishes these
findings; no actual build, import, example execution or agent benchmark was
performed. No overall quality percentage is justified.

In a real review, replace the example's contract pointers with the actual
source/document paths, lines or headings and revision, plus short exact quotes.

## Calibrating adjacent cases

- If the document has every required fact and an additional encryption claim,
  inspect that extra claim too. A bounded source that says nothing about
  encryption establishes lack of support, not proof that encryption is absent.
- If reversed table rows have explicit authoritative numeric priorities, the
  order alone is not a confirmed defect. Sorting can be an optional edit.
- If clear documentation says `<= 256` but generated code uses `< 256`, record
  an implementation error. A read trace and this one failure do not establish
  that rewriting the document would have prevented it.
- If an initial test passed an interior value and a later boundary test fails,
  retain both observations. The later diagnostic reveals a test gap without
  rewriting the saved primary result.
- If full-context input grows from 1000 to 1500 tokens while Output stays 100,
  report the 500-token Input increase. This is not measured retrieval TTC,
  extra reasoning, or evidence that the longer document reduced correctness.
