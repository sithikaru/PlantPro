import { PartialType } from '@nestjs/swagger';
import { CreateHealthLogDto } from './create-health-log.dto';

export class UpdateHealthLogDto extends PartialType(CreateHealthLogDto) {}
