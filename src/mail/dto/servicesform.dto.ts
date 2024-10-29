import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';

export class servicesFormDto {

    @IsString()
    @IsNotEmpty()
    name: string;

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
    contacto: string;

    @IsString()
    @IsNotEmpty()
    Phone: string;

    @IsString()
    @IsNotEmpty()
    id: string;
    

   
}