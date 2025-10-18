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
  socialHistory?: string;

  @IsString()
  @IsOptional()
  familyHistory?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];

  @IsString()
  @IsOptional()
  bloodType?: string;

  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @IsString()
  @IsOptional()
  insurancePolicyNumber?: string;

  @IsString()
  @IsOptional()
  primaryCarePhysician?: string;
}

export class EhrMappingDto {
  @IsString()
  @IsNotEmpty()
  ehrName: string;

  @IsNotEmpty()
  mappingConfig: Record<string, string>;
}

export class EhrEndpointDto {
  @IsString()
  @IsNotEmpty()
  endpointName: string;

  @IsString()
  @IsNotEmpty()
  endpointUrl: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  supportedFields: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

export class MultiEndpointEhrMappingDto {
  @IsString()
  @IsNotEmpty()
  ehrName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EhrEndpointDto)
  endpoints: EhrEndpointDto[];

  @IsNotEmpty()
  fieldMappings: Record<string, Record<string, string>>;
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetEndpoints?: string[];
}
