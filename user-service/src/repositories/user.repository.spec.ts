import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Prisma, type PrismaClient } from '@prismagen/client';
import { UserRepository, InsufficientFundsError } from './user.repository';

describe('UserRepository', () => {
	let repository: UserRepository;
	let prisma: ReturnType<typeof mockDeep<PrismaClient>>;

	beforeEach(() => {
		prisma = mockDeep<PrismaClient>();
		prisma.$transaction = vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)) as unknown as typeof prisma.$transaction;
		repository = new UserRepository(prisma);
	});

	it('debits sender only when balance covers the amount (conditional updateMany)', async () => {
		prisma.user.updateMany.mockResolvedValue({ count: 1 });

		await expect(repository.transferBalance('from_1', 'to_1', new Prisma.Decimal('20'), 'key_1')).resolves.toBeUndefined();

		expect(prisma.transfer.create).toHaveBeenCalledWith({
			data: { idempotencyKey: 'key_1', fromUserId: 'from_1', toUserId: 'to_1', amount: new Prisma.Decimal('20') },
		});
		expect(prisma.user.updateMany).toHaveBeenCalledWith({
			where: { id: 'from_1', balance: { gte: new Prisma.Decimal('20') } },
			data: { balance: { decrement: new Prisma.Decimal('20') } },
		});
		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: 'to_1' },
			data: { balance: { increment: new Prisma.Decimal('20') } },
		});
	});

	it('updates zero rows and throws InsufficientFundsError when balance is insufficient', async () => {
		prisma.user.updateMany.mockResolvedValue({ count: 0 });

		await expect(repository.transferBalance('from_1', 'to_1', new Prisma.Decimal('80'), 'key_2')).rejects.toBeInstanceOf(InsufficientFundsError);

		expect(prisma.transfer.create).toHaveBeenCalled();
		expect(prisma.user.update).not.toHaveBeenCalled();
	});

	it('keeps transfer.create first and credits the recipient only after the debit', async () => {
		prisma.user.updateMany.mockResolvedValue({ count: 1 });

		await repository.transferBalance('from_1', 'to_1', new Prisma.Decimal('10'), 'key_3');

		const createOrder = (prisma.transfer.create as unknown as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
		const debitOrder = (prisma.user.updateMany as unknown as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
		const creditOrder = (prisma.user.update as unknown as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0];
		expect(createOrder ?? 0).toBeLessThan(debitOrder ?? 0);
		expect(debitOrder ?? 0).toBeLessThan(creditOrder ?? 0);
	});

	it('treats a duplicate idempotency key as a no-op (P2002)', async () => {
		prisma.transfer.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.0.0' }));

		await expect(repository.transferBalance('from_1', 'to_1', new Prisma.Decimal('10'), 'key_dup')).resolves.toBeUndefined();

		expect(prisma.user.updateMany).not.toHaveBeenCalled();
		expect(prisma.user.update).not.toHaveBeenCalled();
	});
});
