import { IsNotEmpty, IsString, IsNumber, IsEmail, IsOptional, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PatientContactDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class PatientDataDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(150)
  age: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ValidateNested()
  @Type(() => PatientContactDto)
  contact: PatientContactDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications?: string[];

  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @IsString()
  @IsOptional()
  symptoms?: string;
}

export class EhrMappingDto {
  @IsString()
  @IsNotEmpty()
  ehrName: string;

  @IsNotEmpty()
  mappingConfig: Record<string, string>;
}

export class SendPatientDataDto {
  @IsString()
  @IsNotEmpty()
  ehrName: string;

  @ValidateNested()
  @Type(() => PatientDataDto)
  patientData: PatientDataDto;

  @IsString()
  @IsOptional()
  language?: string = 'en';
}
