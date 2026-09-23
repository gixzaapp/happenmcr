export type Poem = {
  id: string;
  title: string;
  author_name: string;
  body_html: string;
  excerpt: string | null;
  place: string | null;
  dedication: string | null;
  image_url: string | null;
  user_id: string | null;
  like_count: number;
  liked: boolean;
  created_at: string;
};

export const POETS_CORNER_PATH = "/mcr-buzz/poets-corner";
export const POETS_CORNER_WRITE_PATH = `${POETS_CORNER_PATH}/write`;
export const POETS_CORNER_PROFILE_PATH = `${POETS_CORNER_PATH}/profile`;
export const POETS_CORNER_LABEL = "Poet's Corner";

export const POETS_CORNER_DESCRIPTION =
  "Read and share poems from Manchester. Community writing on HappenMCR, with a place to like or report a piece.";

export const POETS_CORNER_DISCLAIMER =
  "Poems are shared by the community and appear as submitted. HappenMCR does not check them before they go live. Please don’t post anything illegal, hateful, or that you don’t have the right to share. Use Report if a poem shouldn’t be here.";

export const POEM_REPORT_CATEGORIES = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright / not their work" },
  { value: "hate", label: "Hateful or abusive" },
  { value: "spam", label: "Spam or misleading" },
  { value: "other", label: "Other" },
] as const;

export type PoemReportCategory = (typeof POEM_REPORT_CATEGORIES)[number]["value"];

export function poemPath(id: string): string {
  return `${POETS_CORNER_PATH}/${id}`;
}

export function poetProfilePath(userId: string): string {
  return `${POETS_CORNER_PROFILE_PATH}/${userId}`;
}

export function poemEditPath(id: string): string {
  return `${poemPath(id)}/edit`;
}
