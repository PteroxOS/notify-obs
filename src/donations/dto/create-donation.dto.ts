import { IsString, IsNumber, IsOptional, IsNotEmpty, Min, IsUrl, IsBoolean } from 'class-validator';

export class CreateDonationDto {
  @IsString()
  @IsNotEmpty()
  streamKey: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(20000, { message: 'Minimal donasi adalah Rp 20.000' })
  amount: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsUrl({}, { message: 'URL YouTube/TikTok/Instagram tidak valid' })
  @IsOptional()
  youtubeUrl?: string;

  @IsUrl({}, { message: 'URL Instagram tidak valid' })
  @IsOptional()
  instagramUrl?: string;

  @IsBoolean()
  @IsOptional()
  isSongShare?: boolean;
}
