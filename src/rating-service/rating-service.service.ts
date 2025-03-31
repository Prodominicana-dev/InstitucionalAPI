// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class RatingServiceService {
//     constructor(private prismaservice: PrismaService) { }

//     async CreateRating(data: any) {
//         try {
//             return await this.prismaservice.ratingServices.create(data);

//         } catch (err) {
//             console.log(err);
//             throw new Error(err);  // throw your error here
//         }
//     }

//     async UpDateRating(id: string, data: any) {
//         try {

//             return await this.prismaservice.ratingServices.update({
//                 where: { id },
//                 data: {
//                     ...data,
//                 },
//             })
//         } catch (error) {

//         }
//     }

//     async DeleteRating(id: string) {

//         try {

//             return await this.prismaservice.ratingServices.delete({
//                 where: { id }
//             })

//         } catch (err) {
//             console.log(err);
//             throw new Error(err);  // throw your error here

//         }
//     }

//     async GetAllRating() {

//         try {

//             return await this.prismaservice.ratingServices.findMany({
//                 where: {
//                     approved: true
//                 }
//             });

//         } catch (err) {

//             console.log(err);
//             throw new Error(err);  // throw your error here

//         }
//     }
// }
