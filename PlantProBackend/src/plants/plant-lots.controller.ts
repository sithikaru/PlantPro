import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { PlantLotsService } from './plant-lots.service';
import { CreatePlantLotDto, UpdatePlantLotDto, QrScanUpdateDto } from './dto/plant-lot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('plant-lots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlantLotsController {
  constructor(private readonly plantLotsService: PlantLotsService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF)
  async create(
    @Body() createPlantLotDto: CreatePlantLotDto,
    @GetUser() user: User
  ) {
    return this.plantLotsService.create(createPlantLotDto, user.id);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF, UserRole.ANALYTICS)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('zoneId') zoneId?: string,
    @Query('speciesId') speciesId?: string,
    @Query('status') status?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const filters = { 
      zoneId: zoneId ? parseInt(zoneId, 10) : undefined,
      speciesId: speciesId ? parseInt(speciesId, 10) : undefined,
      status,
      assignedToId: assignedToId ? parseInt(assignedToId, 10) : undefined,
    };
    return this.plantLotsService.findAll(pageNum, limitNum, filters);
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF, UserRole.ANALYTICS)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plantLotsService.findOne(id);
  }

  @Get(':id/qr-code')
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF)
  async getQRCode(@Param('id', ParseIntPipe) id: number) {
    const qrCodeImage = await this.plantLotsService.generateQRCodeImage(id);
    return {
      id,
      qrCode: qrCodeImage,
      type: 'data:image/png;base64'
    };
  }

  @Get('qr/:qrCode')
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF, UserRole.ANALYTICS)
  async findByQrCode(@Param('qrCode') qrCode: string) {
    return this.plantLotsService.findByQrCode(qrCode);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlantLotDto: UpdatePlantLotDto
  ) {
    return this.plantLotsService.update(id, updatePlantLotDto);
  }

  @Post('qr-scan')
  @Roles(UserRole.MANAGER, UserRole.FIELD_STAFF)
  @HttpCode(HttpStatus.OK)
  async updateByQrScan(
    @Body() qrScanUpdateDto: QrScanUpdateDto,
    @GetUser() user: User
  ) {
    return this.plantLotsService.updateByQrScan(qrScanUpdateDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.plantLotsService.remove(id);
  }
}

// Example HTTP requests and responses:

/*
POST /api/v1/plant-lots
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "speciesId": 1,
  "zoneId": 1,
  "plantCount": 100,
  "plantedDate": "2025-07-28",
  "expectedHarvestDate": "2025-10-28",
  "assignedToId": 2,
  "notes": "High yield variety planted in northern section",
  "location": {
    "section": "A",
    "row": 1,
    "column": 5
  }
}

Response:
{
  "id": 1,
  "lotNumber": "NORTH01172534901",
  "qrCode": "PLT-NORTH01172534901",
  "plantCount": 100,
  "plantedDate": "2025-07-28",
  "expectedHarvestDate": "2025-10-28",
  "status": "seedling",
  "currentYield": null,
  "notes": "High yield variety planted in northern section",
  "location": {
    "section": "A",
    "row": 1,
    "column": 5
  },
  "speciesId": 1,
  "zoneId": 1,
  "assignedToId": 2,
  "createdAt": "2025-07-28T10:30:00.000Z",
  "updatedAt": "2025-07-28T10:30:00.000Z"
}

---

GET /api/v1/plant-lots?page=1&limit=10&zoneId=1&status=growing
Authorization: Bearer <jwt_token>

Response:
{
  "data": [
    {
      "id": 1,
      "lotNumber": "NORTH01172534901",
      "qrCode": "PLT-NORTH01172534901",
      "plantCount": 100,
      "status": "growing",
      "species": {
        "id": 1,
        "name": "Tomato"
      },
      "zone": {
        "id": 1,
        "name": "North Field"
      },
      "assignedTo": {
        "id": 2,
        "firstName": "Field",
        "lastName": "Staff"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}

---

GET /api/v1/plant-lots/1/qr-code
Authorization: Bearer <jwt_token>

Response:
{
  "id": 1,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "type": "data:image/png;base64"
}

---

POST /api/v1/plant-lots/qr-scan
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "qrCode": "PLT-NORTH01172534901",
  "status": "mature",
  "currentYield": 450.5,
  "notes": "Plants looking healthy, ready for harvest next week"
}

Response:
{
  "id": 1,
  "lotNumber": "NORTH01172534901",
  "status": "mature",
  "currentYield": 450.5,
  "notes": "Plants looking healthy, ready for harvest next week",
  "lastScannedAt": "2025-07-28T14:30:00.000Z",
  "lastScannedBy": 2,
  ...
}
*/
