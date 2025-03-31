// import {
// Controller,
// Body,
// Param,
// Post,
// Get,
// Patch,
// Delete,

// } from '@nestjs/common';

// import { RatingServiceService } from './rating-service.service';
// import { RatingServiceDTO } from './dto/rating-service.dto'

// @Controller('apiv2/rating-service')
// export class RatingServiceController {
//     constructor(private readonly ratingserviceservice: RatingServiceService) { }

//     @Post()

//     async createRating(@Body() date: RatingServiceDTO) {

//         try {

//             const rating = await this.ratingserviceservice.CreateRating(date);

//             return rating;

//         } catch (error) {

//             console.log(error);

//             throw new Error(error);

//         }

//     }

//     @Patch(':id')

//     async updateRating(@Body() data:RatingServiceDTO){

//         try {

//             const rating = await this.ratingserviceservice.UpDateRating(data.id, data)

//             return rating;
            
//         } catch (error) {
            
//             console.log(error);

//             throw new Error(error)
            
//         }
//     }


//     @Delete(':id')

//     async deleteRating(@Param('id') id:string){

//         try {
            
//           const rating = await this.ratingserviceservice.DeleteRating(id);

//           return rating;

//         } catch (error) {
//             console.log(error)
            
//             throw new Error(error)
//         }
//     }


//     @Get()

//     async getAllRating(){

//         try {
//              const rating = await this.ratingserviceservice.GetAllRating()
//              return rating;

//         } catch (error) {
//             console.log(error);

//             throw new Error(error);
            
            
//         }
//     }


// }
