import legitScholarships from "../data/legit-scholarships.json";
/**
 * Tokenizes text into lowercase word tokens, removing punctuation and common stop words.
 */
export function tokenizeText(text) {
    const stopWords = new Set([
        "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
        "is", "are", "was", "were", "by", "from", "it", "this", "that", "be", "as"
    ]);
    return (text || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
}
/**
 * Generates n-gram shingles (tuples of consecutive n tokens).
 */
export function generateShingles(tokens, n = 3) {
    const shingles = new Set();
    if (tokens.length < n) {
        if (tokens.length > 0)
            shingles.add(tokens.join(" "));
        return shingles;
    }
    for (let i = 0; i <= tokens.length - n; i++) {
        shingles.add(tokens.slice(i, i + n).join(" "));
    }
    return shingles;
}
/**
 * Computes Jaccard Similarity between two sets: |A ∩ B| / |A ∪ B|.
 */
export function calculateJaccardSimilarity(setA, setB) {
    if (setA.size === 0 || setB.size === 0)
        return 0;
    let intersection = 0;
    for (const elem of setA) {
        if (setB.has(elem)) {
            intersection++;
        }
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}
/** Maximum points this analyzer can contribute to the final risk score. */
const MAX_CONTRIBUTION = 15;
/**
 * Analyzes text against verified scholarship corpus using n-gram shingling & Jaccard index.
 */
export function analyzeCopiedContent(options) {
    const flags = [];
    const evidence = [];
    let score = 0;
    const content = options.text || "";
    const domain = (options.domain || "").toLowerCase().trim();
    const inputTokens = tokenizeText(content);
    const inputShingles = generateShingles(inputTokens, 3);
    let highestSimilarity = 0;
    let mostSimilarScholarship = null;
    // Compare against all legitimate scholarship descriptions
    for (const legit of legitScholarships) {
        const corpusTokens = tokenizeText(legit.description);
        const corpusShingles = generateShingles(corpusTokens, 3);
        const sim = calculateJaccardSimilarity(inputShingles, corpusShingles);
        if (sim > highestSimilarity) {
            highestSimilarity = sim;
            mostSimilarScholarship = legit;
        }
    }
    const simPercent = (highestSimilarity * 100).toFixed(1);
    if (highestSimilarity >= 0.25 && mostSimilarScholarship) {
        const officialDomain = mostSimilarScholarship.officialDomain.toLowerCase();
        const isDomainMatch = domain === officialDomain ||
            domain.endsWith("." + officialDomain) ||
            (officialDomain.includes("fulbright") && domain.includes("fulbrightonline.org")) ||
            (officialDomain.includes("chevening") && domain.includes("chevening.org"));
        if (isDomainMatch) {
            // High text similarity on the official domain is a positive authenticity confirmation!
            flags.push({
                id: "AUTHENTIC_TEXT_VERIFIED",
                ruleId: "AUTHENTIC_TEXT_VERIFIED",
                category: "CONTENT",
                severity: "INFO",
                status: "TRUST",
                title: "Official Program Text Matched",
                description: `Text matches the verified description for "${mostSimilarScholarship.name}" (${simPercent}% similarity) on its registered official domain.`,
                evidence: `Official domain "${officialDomain}" confirmed.`,
                scoreContribution: 0,
                limitations: "Text comparison is against a local corpus of approximately 25 scholarship descriptions. High similarity on an official domain is a positive indicator.",
            });
            evidence.push(`Text accurately matches verified scholarship "${mostSimilarScholarship.name}".`);
            score = 0;
        }
        else {
            // High text similarity on a NON-OFFICIAL domain warrants further verification
            const severity = highestSimilarity > 0.4 ? "HIGH" : "MEDIUM";
            const penalty = highestSimilarity > 0.4 ? 12 : 8;
            flags.push({
                id: "HIGH_CONTENT_SIMILARITY",
                ruleId: "HIGH_CONTENT_SIMILARITY",
                category: "CONTENT",
                severity,
                status: "SUSPICIOUS",
                title: `High Content Similarity (${mostSimilarScholarship.name})`,
                description: `The submitted text shows ${simPercent}% similarity to the description of "${mostSimilarScholarship.name}" in our local records, but the domain "${domain || "not provided"}" does not match the expected official domain "${officialDomain}". This warrants further verification.`,
                evidence: `Matches official text from "${mostSimilarScholarship.name}" (${simPercent}% 3-gram match). Official host is "${officialDomain}".`,
                scoreContribution: penalty,
                limitations: "Similarity is calculated using 3-gram Jaccard comparison against a local corpus. Generic scholarship language may produce elevated similarity scores. This does not prove content was copied.",
            });
            evidence.push(`High content similarity with "${mostSimilarScholarship.name}" (${simPercent}% similarity) on non-official domain.`);
            score += penalty;
        }
    }
    else {
        // Content does not match known corpus
        score = 0;
        if (inputTokens.length >= 10) {
            flags.push({
                id: "LOW_CORPUS_SIMILARITY",
                ruleId: "LOW_CORPUS_SIMILARITY",
                category: "CONTENT",
                severity: "INFO",
                status: "INCONCLUSIVE",
                title: "Low Corpus Similarity",
                description: `Content similarity against the local verified corpus is low (${simPercent}%). This indicates the text does not closely match any of the approximately 25 scholarships in the local comparison dataset.`,
                evidence: `Similarity: ${simPercent}%`,
                scoreContribution: 0,
                limitations: "Comparison is limited to the local corpus. No internet-based plagiarism search is performed.",
            });
        }
        else {
            flags.push({
                id: "INSUFFICIENT_COMPARISON_DATA",
                ruleId: "INSUFFICIENT_COMPARISON_DATA",
                category: "CONTENT",
                severity: "INFO",
                status: "INCONCLUSIVE",
                title: "Insufficient Comparison Data",
                description: "Content Similarity: Insufficient comparison data. The provided text is too short for meaningful similarity analysis.",
                evidence: `Input token count: ${inputTokens.length}`,
                scoreContribution: 0,
                limitations: "Comparison is limited to the local corpus. No internet-based plagiarism search is performed.",
            });
        }
        evidence.push(`Content similarity against verified corpus is low (${simPercent}%), indicating independent or custom text.`);
    }
    const finalScore = Math.min(MAX_CONTRIBUTION, Math.max(0, score));
    return {
        analyzerName: "Copied Content Analyzer",
        score: finalScore,
        maxContribution: MAX_CONTRIBUTION,
        scoreContribution: finalScore,
        flags,
        evidence,
        details: {
            highestSimilarity,
            simPercent: `${simPercent}%`,
            matchedScholarship: mostSimilarScholarship ? mostSimilarScholarship.name : null,
            inputTokenCount: inputTokens.length,
        },
    };
}
