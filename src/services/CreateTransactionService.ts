import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  Transaction_title: string;
  Transaction_value: number;
  Transaction_type: 'income' | 'outcome';
  Transaction_category: string;
}

class CreateTransactionService {
  public async execute({
    Transaction_title,
    Transaction_value,
    Transaction_type,
    Transaction_category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionRepository.getBalance();

    if (Transaction_type === 'outcome' && Transaction_value > balance.total)
      throw new AppError('O valor insuficiente', 400);

    let category = await categoryRepository.findOne({
      where: { title: Transaction_category },
    });

    if (!category) {
      category = categoryRepository.create({
        title: Transaction_category,
      });
      await categoryRepository.save(category);
    }

    const transaction = await transactionRepository.create({
      title: Transaction_title,
      value: Transaction_value,
      type: Transaction_type,
      category,
    });

    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
