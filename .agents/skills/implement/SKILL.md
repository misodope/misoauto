---
name: implement
description: Implements a given prompt without human interaction.
---

# Implement

You are tasked with implementing a given task with specific changes and success criteria. You should always use the codebase as your context for patterns and practices to follow.

## Getting Started

* Read the task description completely
* Read all files mentioned and any related files in the codebase
* Read files fully - never use limit/offset parameters, you need complete context
* Think deeply about how the pieces fit together
* Derive what needs to be built from the task description combined with existing code patterns
* Create a todo list to track your progress
* Start implementing immediately

## Implementation Philosophy

Task descriptions are carefully written, but reality can be messy. Your job is to:

* Follow the task's intent while adapting to what you find
* Use existing codebase patterns, conventions, and architecture as your guide for any ambiguity
* Implement each phase fully before moving to the next
* Verify your work makes sense in the broader codebase context
* Make reasonable decisions autonomously — infer intent from the code and task rather than stopping

## Verification Approach

After implementing a phase:

* Run the success criteria checks, tests, type checks, etc.
* Fix any issues before proceeding
* Update your progress in your todos
* Continue to the next phase automatically

Do not pause for human verification. Fully implement and verify all phases end-to-end before stopping.

## If You Get Stuck

When something isn't working as expected:

* Make sure you've read and understood all the relevant code
* Consider if the codebase has evolved since the task was written
* Use your best judgment to resolve the issue based on codebase context
* Use sub-tasks sparingly for targeted debugging or exploring unfamiliar territory

Do not stop to ask questions. Use the codebase as your source of truth and make the best decision you can.

## Completion

Once all phases are implemented and verified:

* Run a final round of tests, type checks, and linting to ensure everything passes
* Create a pull request using the GitHub CLI (`gh`) or GitHub MCP tools
  * Use a clear, descriptive PR title based on the task
  * Include a summary of changes in the PR body
  * Reference any relevant ticket/issue numbers
* Present the PR link and a summary of what was implemented

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum from start to finish with zero interruptions.
