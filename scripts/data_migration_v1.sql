-- Data Migration V1: Categorize existing solved_slugs into plan_progress object
DO $$
DECLARE
    l75_slugs text[] := ARRAY[
        'merge-strings-alternately', 'greatest-common-divisor-of-strings', 'kids-with-the-greatest-number-of-candies', 
        'can-place-flowers', 'reverse-vowels-of-a-string', 'reverse-words-in-a-string', 'product-of-array-except-self', 
        'increasing-triplet-subsequence', 'string-compression', 'move-zeroes', 'is-subsequence', 'container-with-most-water', 
        'max-number-of-k-sum-pairs', 'maximum-average-subarray-i', 'maximum-number-of-vowels-in-a-substring-of-given-length', 
        'max-consecutive-ones-iii', 'longest-subarray-of-1s-after-deleting-one-element', 'find-the-highest-altitude', 
        'find-pivot-index', 'find-the-difference-of-two-arrays', 'unique-number-of-occurrences', 'determine-if-two-strings-are-close', 
        'equal-row-and-column-pairs', 'removing-stars-from-a-string', 'asteroid-collision', 'decode-string', 'number-of-recent-calls', 
        'dota2-senate', 'delete-the-middle-node-of-a-linked-list', 'odd-even-linked-list', 'reverse-linked-list', 
        'maximum-twin-sum-of-a-linked-list', 'maximum-depth-of-binary-tree', 'leaf-similar-trees', 'count-good-nodes-in-binary-tree', 
        'path-sum-iii', 'longest-zigzag-path-in-a-binary-tree', 'lowest-common-ancestor-of-a-binary-tree', 'binary-tree-right-side-view', 
        'maximum-level-sum-of-a-binary-tree', 'search-in-a-binary-search-tree', 'delete-node-in-a-bst', 'keys-and-rooms', 
        'number-of-provinces', 'reorder-routes-to-make-all-paths-lead-to-the-city-zero', 'evaluate-division', 
        'nearest-exit-from-entrance-in-maze', 'rotting-oranges', 'kth-largest-element-in-an-array', 'smallest-number-in-infinite-set', 
        'maximum-subsequence-score', 'total-cost-to-hire-k-workers', 'guess-number-higher-or-lower', 
        'successful-pairs-of-spells-and-potions', 'find-peak-element', 'koko-eating-bananas', 'letter-combinations-of-a-phone-number', 
        'combination-sum-iii', 'n-th-tribonacci-number', 'min-cost-climbing-stairs', 'house-robber', 'domino-and-tromino-tiling', 
        'unique-paths', 'longest-common-subsequence', 'best-time-to-buy-and-sell-stock-with-transaction-fee', 'edit-distance', 
        'counting-bits', 'single-number', 'minimum-flips-to-make-a-or-b-equal-to-c', 'implement-trie-prefix-tree', 
        'search-suggestions-system', 'non-overlapping-intervals', 'minimum-number-of-arrows-to-burst-balloons', 
        'daily-temperatures', 'online-stock-span'
    ];
    t150_slugs text[] := ARRAY[
        'merge-sorted-array', 'remove-element', 'remove-duplicates-from-sorted-array', 'remove-duplicates-from-sorted-array-ii', 
        'majority-element', 'rotate-array', 'best-time-to-buy-and-sell-stock', 'best-time-to-buy-and-sell-stock-ii', 'jump-game', 
        'jump-game-ii', 'h-index', 'insert-delete-getrandom-o1', 'product-of-array-except-self', 'gas-station', 'candy', 
        'trapping-rain-water', 'roman-to-integer', 'integer-to-roman', 'length-of-last-word', 'longest-common-prefix', 
        'reverse-words-in-a-string', 'zigzag-conversion', 'find-the-index-of-the-first-occurrence-in-a-string', 'text-justification', 
        'valid-palindrome', 'is-subsequence', 'two-sum-ii-input-array-is-sorted', 'container-with-most-water', '3sum', 
        'minimum-size-subarray-sum', 'longest-substring-without-repeating-characters', 'substring-with-concatenation-of-all-words', 
        'minimum-window-substring', 'valid-sudoku', 'spiral-matrix', 'rotate-image', 'set-matrix-zeroes', 'game-of-life', 
        'ransom-note', 'isomorphic-strings', 'word-pattern', 'valid-anagram', 'group-anagrams', 'two-sum', 'happy-number', 
        'contains-duplicate-ii', 'longest-consecutive-sequence', 'summary-ranges', 'merge-intervals', 'insert-interval', 
        'minimum-number-of-arrows-to-burst-balloons', 'valid-parentheses', 'simplify-path', 'min-stack', 
        'evaluate-reverse-polish-notation', 'basic-calculator', 'linked-list-cycle', 'add-two-numbers', 'merge-two-sorted-lists', 
        'copy-list-with-random-pointer', 'reverse-linked-list-ii', 'reverse-nodes-in-k-group', 'remove-nth-node-from-end-of-list', 
        'remove-duplicates-from-sorted-list-ii', 'rotate-list', 'partition-list', 'lru-cache', 'maximum-depth-of-binary-tree', 
        'same-tree', 'invert-binary-tree', 'symmetric-tree', 'construct-binary-tree-from-preorder-and-inorder-traversal', 
        'construct-binary-tree-from-inorder-and-postorder-traversal', 'populating-next-right-pointers-in-each-node-ii', 
        'flatten-binary-tree-to-linked-list', 'path-sum', 'sum-root-to-leaf-numbers', 'binary-tree-maximum-path-sum', 
        'binary-search-tree-iterator', 'count-complete-tree-nodes', 'lowest-common-ancestor-of-a-binary-tree', 
        'binary-tree-right-side-view', 'average-of-levels-in-binary-tree', 'binary-tree-level-order-traversal', 
        'binary-tree-zigzag-level-order-traversal', 'minimum-absolute-difference-in-bst', 'kth-smallest-element-in-a-bst', 
        'validate-binary-search-tree', 'number-of-islands', 'surrounded-regions', 'clone-graph', 'evaluate-division', 
        'course-schedule', 'course-schedule-ii', 'snakes-and-ladders', 'minimum-genetic-mutation', 'word-ladder', 
        'implement-trie-prefix-tree', 'design-add-and-search-words-data-structure', 'word-search-ii', 
        'letter-combinations-of-a-phone-number', 'combinations', 'permutations', 'combination-sum', 'n-queens-ii', 
        'generate-parentheses', 'word-search', 'convert-sorted-array-to-binary-search-tree', 'sort-list', 'construct-quad-tree', 
        'merge-k-sorted-lists', 'maximum-subarray', 'maximum-sum-circular-subarray', 'search-insert-position', 'search-a-2d-matrix', 
        'find-peak-element', 'search-in-rotated-sorted-array', 'find-first-and-last-position-of-element-in-sorted-array', 
        'find-minimum-in-rotated-sorted-array', 'median-of-two-sorted-arrays', 'kth-largest-element-in-an-array', 'ipo', 
        'find-k-pairs-with-smallest-sums', 'find-median-from-data-stream', 'add-binary', 'reverse-bits', 'number-of-1-bits', 
        'single-number', 'single-number-ii', 'bitwise-and-of-numbers-range', 'palindrome-number', 'plus-one', 
        'factorial-trailing-zeroes', 'sqrtx', 'powx-n', 'max-points-on-a-line', 'climbing-stairs', 'house-robber', 'word-break', 
        'coin-change', 'longest-increasing-subsequence', 'triangle', 'minimum-path-sum', 'unique-paths-ii', 
        'longest-palindromic-substring', 'interleaving-string', 'edit-distance', 'best-time-to-buy-and-sell-stock-iii', 
        'best-time-to-buy-and-sell-stock-iv', 'maximal-square'
    ];
BEGIN
    UPDATE users
    SET plan_progress = jsonb_strip_nulls(jsonb_build_object(
        'leetcode-75', (
            SELECT to_jsonb(ARRAY(
                SELECT slug 
                FROM unnest(solved_slugs) AS slug 
                WHERE slug = ANY(l75_slugs)
            ))
        ),
        'top-interview-150', (
            SELECT to_jsonb(ARRAY(
                SELECT slug 
                FROM unnest(solved_slugs) AS slug 
                WHERE slug = ANY(t150_slugs)
            ))
        )
    ))
    WHERE (plan_progress IS NULL OR plan_progress = '{}'::jsonb)
      AND solved_slugs IS NOT NULL 
      AND array_length(solved_slugs, 1) > 0;
END $$;
