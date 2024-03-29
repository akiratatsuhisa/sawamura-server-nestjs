import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { DropboxModule } from 'src/dropbox/dropbox.module';
import { FileUtilsModule } from 'src/file-utils/file-utils.module';
import { Multer } from 'src/helpers';
import { MaterialDesignModule } from 'src/material-design/material-design.module';
import { SendgridModule } from 'src/sendgrid/sendgrid.module';
import { UsersModule } from 'src/users/users.module';
import { VerificationTokensModule } from 'src/verification-tokens/verification-tokens.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy, LocalStrategy } from './strategies';

@Global()
@Module({
  imports: [
    SendgridModule,
    FileUtilsModule,
    DropboxModule,
    PassportModule,
    UsersModule,
    VerificationTokensModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get<string>('SECRET'),
          signOptions: { expiresIn: configService.get<string>('EXPIRES_IN') },
        };
      },
    }),
    MulterModule.register({
      storage: Multer.declareStorageEngine(),
    }),
    MaterialDesignModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
