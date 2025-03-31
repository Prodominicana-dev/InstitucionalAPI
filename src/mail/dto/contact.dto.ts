import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';

export class ContactDto {

    @IsString()
    @IsNotEmpty()
    nameF: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    email: string;


    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsNotEmpty()
    identity: string;

    @IsString()
    @IsNotEmpty()
    activity: string;

}