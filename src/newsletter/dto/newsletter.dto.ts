import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateNewsletterDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsOptional()
  @IsIn(['draft', 'scheduled', 'published', 'sent'])
  state?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @IsOptional()
  @IsDateString()
  scheduledSendDate?: string;

  @IsOptional()
  @IsString()
  created_By?: string;
}

export class UpdateNewsletterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleEn?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsIn(['draft', 'scheduled', 'published', 'sent'])
  state?: string;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @IsOptional()
  @IsDateString()
  scheduledSendDate?: string;

  @IsOptional()
  @IsString()
  updated_By?: string;
}
