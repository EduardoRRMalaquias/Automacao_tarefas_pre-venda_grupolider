// Brand Manager - Sistema Modular de Marcas

class BrandManager {
  constructor() {
    this.brands = new Map();
    this.tasks = new Map();
  }

  registerBrand(brandId, brandConfig) {
    if (this.brands.has(brandId)) {
      console.warn("Marca " + brandId + " ja registrada. Sobrescrevendo...");
    }

    this.brands.set(brandId, brandConfig);
    console.log("Marca registrada: " + brandId);

    if (brandConfig.tasks) {
      Object.entries(brandConfig.tasks).forEach(([taskId, taskConfig]) => {
        const fullTaskId = brandId + ":" + taskId;
        this.tasks.set(fullTaskId, {
          ...taskConfig,
          brandId,
          taskId,
        });
      });
    }
  }

  getBrand(brandId) {
    return this.brands.get(brandId) || null;
  }

  getTask(brandId, taskId) {
    const fullTaskId = brandId + ":" + taskId;
    return this.tasks.get(fullTaskId) || null;
  }

  async executeTask(brandId, taskId, context) {
    context = context || {};
    const task = this.getTask(brandId, taskId);

    if (!task) {
      throw new Error("Tarefa nao encontrada: " + brandId + ":" + taskId);
    }

    if (typeof task.execute !== "function") {
      throw new Error("Tarefa " + taskId + " nao possui funcao execute()");
    }

    console.log("Executando: " + brandId + " > " + taskId);

    try {
      const result = await task.execute(context);
      return {
        success: true,
        brandId: brandId,
        taskId: taskId,
        result: result,
      };
    } catch (error) {
      console.error("Erro ao executar " + brandId + ":" + taskId + ":", error);
      return {
        success: false,
        brandId: brandId,
        taskId: taskId,
        error: error.message,
      };
    }
  }

  listBrands() {
    return Array.from(this.brands.keys());
  }

  listTasks(brandId) {
    return Array.from(this.tasks.keys())
      .filter(function (key) {
        return key.startsWith(brandId + ":");
      })
      .map(function (key) {
        return key.split(":")[1];
      });
  }
}

window.brandManager = new BrandManager();

console.log("Brand Manager inicializado");
