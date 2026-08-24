import type { Client } from '~/interfaces/catalogs/client';

export interface Contract {
  id: number;
  client_id: number;
  notes: string;
  is_active: boolean;
}

export interface ContractItem {
  id: number;
  service_id: number;
  service_name: string;
  price: string;
  price_multiplier: string;
  percentaje: string;
  notes: string;
  is_active: boolean;
}

export interface ContractItemCreateBody {
  service: number;
  price: string;
  price_multiplier?: string;
  percentaje?: string;
  notes?: string;
}

export type ContractItemUpdateBody = ContractItemCreateBody;

export interface ContractCreateBody {
  client: number;
  notes: string;
  items?: ContractItemCreateBody[];
}

export interface ContractUpdateBody {
  client: number;
  notes: string;
}

export interface ClientContractRow {
  client: Client;
  contract?: Contract;
}
