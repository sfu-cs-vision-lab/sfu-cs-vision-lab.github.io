export type PersonLinks = {
  email?: string | null;
  site?: string | null;
  scholar?: string | null;
  github?: string | null;
  linkedin?: string | null;
  orcid?: string | null;
  thesis?: string | null;
};

export type Person = {
  name: string;
  role?: string | null;
  joined?: string | null; // year the person joined the lab; their ORCID works count from then (scripts/fetch_orcid.mjs)
  thesisTitle?: string | null; // linked to links.thesis when the thesis is online
  thesisYear?: string | null;
  bio?: string | null;
  image?: string | null;
  links?: PersonLinks;
};

export type Director = {
  name: string;
  title: string;
  image?: string | null;
  researchInterests: string[];
  teachingInterests: string[];
  education: string[];
  links?: PersonLinks;
};

export type PeopleData = {
  director: Director;
  current: Person[];
  former: Person[];
};

