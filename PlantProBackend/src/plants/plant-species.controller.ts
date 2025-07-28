import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PlantSpeciesService } from './plant-species.service';
import { CreatePlantSpeciesDto } from './dto/plant-species/create-plant-species.dto';
import { UpdatePlantSpeciesDto } from './dto/plant-species/update-plant-species.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('plant-species')
@Controller('plant-species')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlantSpeciesController {
  constructor(private readonly plantSpeciesService: PlantSpeciesService) {}

  @Post()
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new plant species' })
  create(@Body() createPlantSpeciesDto: CreatePlantSpeciesDto) {
    return this.plantSpeciesService.create(createPlantSpeciesDto);
  }

  @Get()
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get all plant species' })
  findAll() {
    return this.plantSpeciesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.FIELD_STAFF, UserRole.MANAGER, UserRole.ANALYTICS)
  @ApiOperation({ summary: 'Get a plant species by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plantSpeciesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a plant species' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlantSpeciesDto: UpdatePlantSpeciesDto,
  ) {
    return this.plantSpeciesService.update(id, updatePlantSpeciesDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a plant species' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.plantSpeciesService.remove(id);
  }
}
