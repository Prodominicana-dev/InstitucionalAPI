import { IsString, IsNumber, IsBoolean, IsNotEmpty, IsDate } from 'class-validator'

export class RatingServiceDTO{

    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsNumber()
    score:number;

    @IsNotEmpty()
    @IsString()
    message:string;

    @IsNotEmpty()
    @IsBoolean()
    approved:boolean;

    @IsNotEmpty()
    @IsDate()
    date?:Date;

}