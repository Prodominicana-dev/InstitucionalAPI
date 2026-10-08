export class CreateNewspaperCoverDto {
  media: string;
  link?: string;
  section?: string;
  date?: string;
  created_By?: string;
}

export class UpdateNewspaperCoverDto {
  media?: string;
  link?: string;
  section?: string;
  date?: string;
  updated_By?: string;
}
