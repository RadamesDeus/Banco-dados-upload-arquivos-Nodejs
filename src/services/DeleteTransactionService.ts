import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transaction = getRepository(Transaction);
    await transaction.delete({ id }).catch(() => {
      throw new AppError('Transaction not found', 400);
    });
  }
}

export default DeleteTransactionService;
