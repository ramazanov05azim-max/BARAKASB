# Plugins

This directory intentionally contains no Plugins during foundation and architecture
hardening.

A future Plugin must target one Solution's versioned extension contract and use the Core
Plugin SDK. It cannot deep-import the Solution, access another module's data, or
introduce undeclared runtime behavior.

Its project metadata names exactly one target Solution and uses the matching
`scope:<solution>` tag. Partner or customer-controlled Plugin code runs only through the
isolated extension runner.
