import { IsString, IsNotEmpty,  } from 'class-validator';

export class sendPageEmail {
    @IsString()
    @IsNotEmpty()
    email: string;
}