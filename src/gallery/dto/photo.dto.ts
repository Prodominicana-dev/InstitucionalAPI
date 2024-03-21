import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';

export class PhotoDto {
  @IsString()
  @IsEmpty()
  name?: string;

  @IsString()
  @IsEmpty()
  size?: string;

  @IsString()
  @IsEmpty()
  galleryId?: string;

  @IsString()
  @IsEmpty()
  created_By?: string;

  @IsString()
  @IsEmpty()
  updated_By?: string;

  @IsEmpty()
  created_At?: Date;

  @IsEmpty()
  updated_At?: Date;
}

export class PhotoUpdateDto {
  @IsString()
  @IsEmpty()
  name?: string;

  @IsString()
  @IsEmpty()
  size?: string;

  @IsString()
  @IsEmpty()
  galleryId?: string;

  @IsString()
  @IsEmpty()
  created_By?: string;

  @IsString()
  @IsEmpty()
  updated_By?: string;

  @IsEmpty()
  created_At?: Date;

  @IsEmpty()
  updated_At?: Date;
}
