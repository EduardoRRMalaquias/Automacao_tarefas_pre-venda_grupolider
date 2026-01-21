import React from 'react';

const SeletorTipoEncaminhamento = ({
  tipoEncaminhamento,
  setTipoEncaminhamento,
}) => {
  return (
    <div>
      <select
        id="tipoEncaminhamento"
        value={tipoEncaminhamento}
        onChange={(e) => setTipoEncaminhamento(e.target.value)}
        className="select-tipo"
      >
        <option value="portal">🌐 Portal (sem contato prévio)</option>
        <option value="contato">💬 Contato (após conversa)</option>
        <option value="direto">
          ⚡ Direto (OLX, webmotors, Digital Drive)
        </option>
      </select>
    </div>
  );
};

export default SeletorTipoEncaminhamento;
