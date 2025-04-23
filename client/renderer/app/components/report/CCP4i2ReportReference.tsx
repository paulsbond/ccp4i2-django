import React from "react";
import { Typography, Stack, Link } from "@mui/material";

interface CCP4i2ReportReferenceProps {
  item: Element;
}

export const CCP4i2ReportReference: React.FC<CCP4i2ReportReferenceProps> = ({
  item,
}) => {
  const title = item.getAttribute("articleTitle") || "Untitled";
  const source = item.getAttribute("source") || "Unknown source";

  let authors: string[] = [];
  const authorListRaw = item.getAttribute("authorList");

  try {
    if (authorListRaw) {
      authors = JSON.parse(authorListRaw.replace(/'/g, '"'));
    }
  } catch (e) {
    console.warn("Failed to parse author list:", authorListRaw);
  }

  // Encode the article title for the PubMed search URL
  const pubmedSearchUrl = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(
    title
  )}`;

  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography variant="body2" fontWeight="bold">
        {authors.length ? authors.join(", ") : "Unknown authors"}
      </Typography>
      <Typography variant="body2" fontStyle="italic">
        <Link
          href={pubmedSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
        >
          {title}
        </Link>
      </Typography>
      <Typography variant="body2">{source}</Typography>
    </Stack>
  );
};

export default CCP4i2ReportReference;
