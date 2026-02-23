// Helper functions to check if an OS is "No Prazo" or "Fora do Prazo"

export const isNoPrazo = (os, hojeDate = new Date()) => {
  // OS sem prazo definido → conta como no prazo
  if (!os.prazo) return true;
  
  if (os.status === 'concluido') {
    // OS concluída com data_conclusao = vazio → considere data_conclusão como igual a do prazo
    const dataConc = os.data_conclusao || os.prazo;
    // OS concluída com data_conclusao <= prazo → no prazo
    return new Date(dataConc) <= new Date(os.prazo);
  }
  
  // OS não concluída com prazo >= hoje → no prazo (prazo ainda não venceu)
  return new Date(os.prazo) >= hojeDate;
};

export const isForaPrazo = (os, hojeDate = new Date()) => {
  // OS sem prazo definido → não conta como fora do prazo
  if (!os.prazo) return false;
  
  if (os.status === 'concluido') {
    // OS concluída com data_conclusao = vazio → considere data_conclusão como igual a do prazo
    const dataConc = os.data_conclusao || os.prazo;
    // OS concluída com data_conclusao > prazo → fora do prazo (venceu a data)
    return new Date(dataConc) > new Date(os.prazo);
  }
  
  // OS não concluída com prazo < hoje → fora do prazo (prazo já passou)
  return new Date(os.prazo) < hojeDate;
};