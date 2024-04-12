import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';

export class GalleryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @IsString()
  @IsNotEmpty()
  cover: string;

  @IsString()
  @IsEmpty()
  date: string;

  @IsString()
  @IsEmpty()
  created_By: string;

  @IsString()
  @IsEmpty()
  updated_By: string;

  @IsEmpty()
  created_At: Date;

  @IsEmpty()
  updated_At: Date;
}

export class GalleryUpdateDto {
  @IsString()
  @IsEmpty()
  title: string;

  @IsString()
  @IsEmpty()
  titleEn: string;

  @IsString()
  @IsEmpty()
  cover: string;

  @IsString()
  @IsEmpty()
  date: string;

  @IsString()
  @IsEmpty()
  created_By: string;

  @IsString()
  @IsEmpty()
  updated_By: string;

  @IsEmpty()
  created_At: Date;

  @IsEmpty()
  updated_At: Date;
}
