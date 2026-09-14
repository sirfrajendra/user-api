import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getUserCount() {
    const count = await this.prisma.user.count();

    return { count };
  }
  
  async findAll(
    search?: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : undefined;

    const [users, total] =
      await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),

        this.prisma.user.count({
          where,
        }),
      ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit,
        ),
      },
    };
  }

  async findOne(id: string) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
      },
    });
  }

  async update(
    id: string,
    data: UpdateUserDto,
  ) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}