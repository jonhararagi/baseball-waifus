#!/usr/bin/env python3
"""Compatibility entry point for the character asset factory.

T067 removes the former provider-specific generation behavior. External image
generation is now an offline producer step; this script only delegates to the
provider-agnostic factory.
"""
from character_asset_factory import main

if __name__ == "__main__":
    raise SystemExit(main(["process", "--character", "bw001"]))
