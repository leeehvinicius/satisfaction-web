import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AddServiceRequest } from '../types/company';
import { companies } from '../services/api';

const formSchema = z.object({
  tipo_servico: z.string().min(1, 'Tipo de serviço é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  hora_final: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  user_add: z.string().min(1, 'Usuário é obrigatório'),
});

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

const AddServiceDialog: React.FC<AddServiceDialogProps> = ({
  open,
  onOpenChange,
  companyId,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddServiceRequest>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: AddServiceRequest) => {
    try {
      await companies.addService(companyId, data);
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Novo Serviço</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Serviço
              </label>
              <input
                type="text"
                {...register('tipo_servico')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.tipo_servico && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.tipo_servico.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                {...register('nome')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Horário de Início
              </label>
              <input
                type="time"
                {...register('hora_inicio')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.hora_inicio && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.hora_inicio.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Horário de Término
              </label>
              <input
                type="time"
                {...register('hora_final')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.hora_final && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.hora_final.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Usuário
              </label>
              <input
                type="text"
                {...register('user_add')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.user_add && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.user_add.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddServiceDialog; 