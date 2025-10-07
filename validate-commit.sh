#!/bin/bash

# Conventional Commits validation script
# Validates that the last commit follows conventional format

echo "🔍 Validating last commit..."

# Get the last commit message
LAST_COMMIT_MSG=$(git log -1 --pretty=format:"%s")

echo "📝 Last commit: $LAST_COMMIT_MSG"

# Use commitlint to validate
echo "$LAST_COMMIT_MSG" | npx commitlint

if [ $? -eq 0 ]; then
    echo "✅ Commit follows Conventional Commits format"
else
    echo "❌ Commit does NOT follow Conventional Commits format"
    echo ""
    echo "📋 Examples of correct format:"
    echo "   feat(frontend): add new avalanche map"
    echo "   fix(backend): resolve database connection issue"
    echo "   docs(readme): update installation guide"
    echo ""
    echo "💡 Use 'npm run commit' for interactive wizard"
fi