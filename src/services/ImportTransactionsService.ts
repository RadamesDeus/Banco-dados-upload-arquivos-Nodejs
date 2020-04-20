import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  pathFile: string;
}

interface RequestCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  public async execute({ pathFile }: Request): Promise<Transaction[]> {
    const arquivoExist = await fs.promises.stat(pathFile);

    if (!arquivoExist) throw new AppError('File not import', 400);

    const requestCSV: RequestCSV[] = [];

    const readCSV = fs.createReadStream(pathFile);
    const parsersConfig = csvParse({
      delimiter: ',',
      from_line: 2,
    });
    const parsersCSV = readCSV.pipe(parsersConfig);
    parsersCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (title || type || value)
        requestCSV.push({ title, type, value, category });
    });
    await new Promise(resolve => parsersCSV.on('end', resolve));
    await fs.promises.unlink(pathFile);
    const categoryRepository = await getRepository(Category);
    const transactionRepository = await getRepository(Transaction);

    const categoryImp = requestCSV.reduce(
      (cateArray: string[], transaction) => {
        if (!cateArray.includes(transaction.category))
          cateArray.push(transaction.category);
        return cateArray;
      },
      [],
    );

    const CategoriasDB = await categoryRepository.find({
      where: { title: In(categoryImp) },
    });

    const CategoriasArray = categoryImp.filter(
      cate => !CategoriasDB.find(({ title }) => title === cate),
    );

    interface TipoCategory {
      title: string;
    }

    const catedoriasparse = CategoriasArray.reduce(
      (CategoriasNovas: TipoCategory[], catergoria) => {
        CategoriasNovas.push({ title: catergoria });
        return CategoriasNovas;
      },
      [],
    );

    const categoriasAdicionada = await categoryRepository.create(
      catedoriasparse,
    );
    await categoryRepository.save(categoriasAdicionada);

    const categores: Category[] = [...CategoriasDB, ...categoriasAdicionada];

    const transactionsImp = requestCSV.map(transactionCSV => ({
      title: transactionCSV.title,
      value: transactionCSV.value,
      type: transactionCSV.type,
      category: categores.find(
        ({ title }) => title === transactionCSV.category,
      ),
    }));

    const transactions = await transactionRepository.create(transactionsImp);
    await transactionRepository.save(transactions);
    return transactions;
  }
}

export default ImportTransactionsService;
