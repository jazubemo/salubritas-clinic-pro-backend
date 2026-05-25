import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import GraphQLJSON from 'graphql-type-json';

//sub-modules
import { UsersModule } from './users/users.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false, // Disables the old playground
      plugins: [ApolloServerPluginLandingPageLocalDefault()], // Enables Apollo Sandbox
      context: ({ req }) => ({ req }),
      resolvers: { JSON: GraphQLJSON },
    }),
    // 3. Use forRootAsync to inject ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        autoIndex: process.env.NODE_ENV !== 'production',
      }),
    }),
    UsersModule,
    FirebaseModule,
  ],

  providers: [],
})
export class AppModule {}
