import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';
// import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const balance: Balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };
    const transactions = await this.find();

    transactions.map(transaction => {
      balance.income += transaction.type === 'income' ? transaction.value : 0;
      balance.outcome += transaction.type === 'outcome' ? transaction.value : 0;
      return balance;
    }, 0);

    balance.total += balance.income - balance.outcome;

    return balance;
  }

  public async all(): Promise<{}> {
    const balance = await this.getBalance();

    const transactions = await this.createQueryBuilder('transactions')
      .leftJoinAndSelect('transactions.category', 'category')
      .select([
        'transactions.id',
        'transactions.title',
        'transactions.value',
        'transactions.type',
        'category.id',
        'category.title',
      ])
      .getMany();

    const data = { transactions, balance };
    return data;
  }
}

export default TransactionsRepository;
