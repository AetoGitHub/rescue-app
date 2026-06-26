export interface OperativeCommissionOperator {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  commission: string | null;
}

export interface OperativeCommissionUpdateBody {
  commission: string;
}

export interface OperativeCommissionBulkItem {
  id: number;
  commission: string;
}
