import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import imageService from '../services/imageService';
import voiceService from '../services/voiceService';
import catalogService from '../services/catalogService';
import pricingService from '../services/pricingService';

export const AddProductFlow = () => {
  const { currentProduct, updateCurrentProduct, publishCurrentProduct, resetCurrentProduct } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(currentProduct.step || 1);
  const [processing, setProcessing] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);

  // Sample image options for fast prototyping
  const sampleImages = [
    {
      name: "Silk Dupatta",
      raw: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTZ9ZdYNYjwvq9BLRKmIA8lrCueU6ss5NaK7NcL4tV4_640CzTmWYawWfXIL62guK6U4_aeNsP7XEHi_XCKkdFsG-Uvz-z5jxlfa6wI8-E_xR433XGR0x6KTEbjRK_uiGbQSYAjI_VKHuDAz206-2hYYSd4fQVwHVL-kFP4xv_pWeHnOMFLjUesGEMNGw8AmVV27wnmQ61K0QrPI4Wd3z2iwGPsmqyHIZPnbctLtiY-23o1zoi5D7c",
      enhanced: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9NdqtHHuX-C3fTyPOFZyJHmhxGdmIUVFNHQnBFec-x4sM6nam9v8zGl_A50EYGmZPn11LroWhvKHY5FCPYBHMXB8smCONqVv0H_O5bW-yoFUMcCyNZrnpHOq1c5STMMu_HCBEfCqtgew-DNpDA_CpmKQ8Hqd4TNZ9Ul3u_9AuI_LdlQ_rhb5UzODrcnCCzKSeWTTtYcrI2hIt2BuU6Z06-W5UYr8AKVJJQ3n9_6C3Kg4iBz6f2QhI"
    },
    {
      name: "Bamboo Basket",
      raw: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud",
      enhanced: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXcQG2IuC0hmcLXI_X7NLHkQS6FBTajGjmTZYlqwFRaBAchUoU9qXJYnXU85awVMUWhJLn6H8iREvMMm0LOxSqbKMT3mofJ_m9uovpzG-9Knzfv04Z_EPyVum0R5IpYVXGknClHW3hb2Y-ruGkmYBiyFRQFAP6Eg0B56uJ0abfnjTmc45ApRtHGAQFhn7toeu_imQWT1-rgMhI0iK3mklaTSDTIIQHHUHyKPtXnzS7CEQMqVR4xNud"
    },
    {
      name: "Terracotta Vase",
      raw: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDVxXiG1dMVQO05bifmAAM_MlqVdxlRfbr0Q7nWUR4dc93terX2jKdxbmNSe-axfInjZH-ReiV2UeHBUJY_eszFGNG3U-0th9I9hWDsxr6D3jNeV-Nfq-gk1-QO0WAQ56z8r8tqZWnx1oBcGYB2gOWuqMCg2SRtl5PGzHznvmQH7hUw9pLkHoIhfPEojBMtrlOoHPOncYYLAjMmewJxDfEOtITbyH3dOIFNFE0X20UVfMrJ-Cqz9E",
      enhanced: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDVxXiG1dMVQO05bifmAAM_MlqVdxlRfbr0Q7nWUR4dc93terX2jKdxbmNSe-axfInjZH-ReiV2UeHBUJY_eszFGNG3U-0th9I9hWDsxr6D3jNeV-Nfq-gk1-QO0WAQ56z8r8tqZWnx1oBcGYB2gOWuqMCg2SRtl5PGzHznvmQH7hUw9pLkHoIhfPEojBMtrlOoHPOncYYLAjMmewJxDfEOtITbyH3dOIFNFE0X20UVfMrJ-Cqz9E"
    }
  ];

  // Image Upload handler
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateCurrentProduct({ image: url, enhancedImage: url });
    }
  };

  // Step 2: Trigger Image Enhancement
  const handleEnhanceNext = async () => {
    setProcessing(true);
    try {
      const res = await imageService.enhanceImage(currentProduct.image);
      updateCurrentProduct({ enhancedImage: res.enhanced });
    } catch {
      // fallback
    } finally {
      setProcessing(false);
      setStep(3);
    }
  };

  // Step 3: Trigger Voice Processing
  const handleVoiceNext = async () => {
    setProcessing(true);
    try {
      const voiceRes = await voiceService.processVoiceDescription(currentProduct.voiceText);
      const catalogRes = await catalogService.generateCatalog(voiceRes.extractedData);
      const pricingRes = await pricingService.recommendPrice({
        materialCost: voiceRes.extractedData.materialCost,
        productionTimeDays: voiceRes.extractedData.productionTimeDays
      });

      updateCurrentProduct({
        ...voiceRes.extractedData,
        ...catalogRes,
        aiSuggestedPrice: pricingRes.suggestedPrice,
        priceRange: pricingRes.recommendedRange,
        finalPrice: pricingRes.suggestedPrice,
        materialCost: pricingRes.breakdown.materialCost
      });
    } catch {
      // fallback
    } finally {
      setProcessing(false);
      setStep(4);
    }
  };

  // Step 8 -> 9: Final Publish
  const handlePublish = () => {
    const published = publishCurrentProduct();
    setStep(9);
  };

  return (
    <div className="bg-background min-h-screen pb-24 pt-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* Top Wizard Progress Indicator */}
      <div className="mb-8 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 soft-shadow">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant mb-2">
          <span>Step {step} of 8</span>
          <span className="text-primary font-display-lg">
            {step === 1 && "Photo Capture"}
            {step === 2 && "AI Photo Enhancement"}
            {step === 3 && "Voice Description"}
            {step === 4 && "Product Info Confirmation"}
            {step === 5 && "AI Catalog Preview"}
            {step === 6 && "AI Pricing Assistant"}
            {step === 7 && "Inventory Setup"}
            {step === 8 && "Final Listing Preview"}
            {step === 9 && "Published Successfully!"}
          </span>
        </div>
        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${(Math.min(step, 8) / 8) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* STEP 1: PHOTO CAPTURE / UPLOAD */}
      {step === 1 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-primary">photo_camera</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 1: Take Product Photo</h2>
            <p className="text-sm text-on-surface-variant">Capture your craft on your workbench or choose from gallery.</p>
          </div>

          {/* Camera Frame Preview */}
          <div className="h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-black relative border-2 border-primary/40 flex items-center justify-center">
            {currentProduct.image ? (
              <img src={currentProduct.image} alt="Selected Craft" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-white/70 p-6 space-y-2">
                <span className="material-symbols-outlined text-5xl">center_focus_weak</span>
                <p className="text-sm">No photo captured yet</p>
              </div>
            )}
            <div className="absolute inset-4 border border-white/40 border-dashed rounded-xl pointer-events-none"></div>
          </div>

          {/* Preset Samples */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-on-surface-variant">Or choose a preset product photo:</span>
            <div className="grid grid-cols-3 gap-3">
              {sampleImages.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => updateCurrentProduct({ image: s.raw, enhancedImage: s.enhanced, title: s.name })}
                  className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    currentProduct.image === s.raw ? 'border-primary bg-primary-fixed/30 text-primary' : 'border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  <img src={s.raw} alt={s.name} className="w-12 h-12 rounded-lg object-cover" />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <label className="flex-1 py-3 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 border border-outline-variant">
              <span className="material-symbols-outlined">photo_library</span>
              <span>Choose from Gallery</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </label>

            <button
              onClick={() => setStep(2)}
              disabled={!currentProduct.image}
              className="flex-1 py-3 px-4 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>Continue to Enhancement</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: IMAGE ENHANCEMENT */}
      {step === 2 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-tertiary">auto_fix_high</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 2: AI Photo Enhancement</h2>
            <p className="text-sm text-on-surface-variant">Our vision model removes background clutter and enhances lighting.</p>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Original Workbench Photo</span>
              <div className="h-60 rounded-2xl overflow-hidden border border-outline-variant bg-surface-dim">
                <img src={currentProduct.image} alt="Original" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-tertiary uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">auto_awesome</span> AI Studio Listing Photo
              </span>
              <div className="h-60 rounded-2xl overflow-hidden border-2 border-tertiary bg-surface-bright relative">
                <img src={currentProduct.enhancedImage || currentProduct.image} alt="Enhanced" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-tertiary-container text-on-tertiary-container text-xs px-2.5 py-1 rounded-full font-bold shadow-md">
                  ✓ Background Cleaned & Lighting Calibrated
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(1)}
              className="py-3 px-6 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
            >
              Back
            </button>
            <button
              onClick={handleEnhanceNext}
              disabled={processing}
              className="flex-1 py-3 px-6 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              {processing ? (
                <span>Enhancing photo...</span>
              ) : (
                <>
                  <span>Accept Enhancement & Continue</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VOICE DESCRIPTION */}
      {step === 3 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-primary">mic</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 3: Speak About Your Product</h2>
            <p className="text-sm text-on-surface-variant">Describe materials, technique, and craft story in Hindi, Marathi, or English.</p>
          </div>

          {/* Voice recording simulation button */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant text-center space-y-4">
            <button
              onClick={() => setRecordingVoice(!recordingVoice)}
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${
                recordingVoice
                  ? 'bg-error text-on-error pulse-animation scale-110'
                  : 'bg-primary-container text-on-primary-container hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-4xl">
                {recordingVoice ? 'stop' : 'mic'}
              </span>
            </button>

            <p className="text-sm font-semibold text-on-surface">
              {recordingVoice ? "Recording... (Speak now)" : "Click mic button to start voice recording"}
            </p>
          </div>

          {/* Text input fallback */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Voice Transcription / Vernacular Text
            </label>
            <textarea
              rows={3}
              value={currentProduct.voiceText}
              onChange={(e) => updateCurrentProduct({ voiceText: e.target.value })}
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm outline-none focus:border-primary resize-none"
              placeholder="e.g. यह रेशम की हाथ से बुनी लाल और सुनहरी दुपट्टा है..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              className="py-3 px-6 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
            >
              Back
            </button>
            <button
              onClick={handleVoiceNext}
              disabled={processing}
              className="flex-1 py-3 px-6 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              {processing ? (
                <span>AI Extracting Product Details...</span>
              ) : (
                <>
                  <span>Process Voice & Extract Info</span>
                  <span className="material-symbols-outlined">auto_awesome</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PRODUCT INFORMATION CONFIRMATION */}
      {step === 4 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-tertiary">edit_note</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 4: Confirm Extracted Product Info</h2>
            <p className="text-sm text-on-surface-variant">Review and update details extracted from your voice input.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Product Title (English)
              </label>
              <input
                type="text"
                value={currentProduct.title}
                onChange={(e) => updateCurrentProduct({ title: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Product Title (Hindi / Vernacular)
              </label>
              <input
                type="text"
                value={currentProduct.titleHindi}
                onChange={(e) => updateCurrentProduct({ titleHindi: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Category
              </label>
              <select
                value={currentProduct.category}
                onChange={(e) => updateCurrentProduct({ category: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              >
                <option value="Textiles">Textiles</option>
                <option value="Bamboo Craft">Bamboo Craft</option>
                <option value="Pottery">Pottery</option>
                <option value="Handicraft">Handicraft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Material Used
              </label>
              <input
                type="text"
                value={currentProduct.material}
                onChange={(e) => updateCurrentProduct({ material: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Craft Technique
              </label>
              <input
                type="text"
                value={currentProduct.craft}
                onChange={(e) => updateCurrentProduct({ craft: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Production Effort (Days)
              </label>
              <input
                type="text"
                value={currentProduct.productionTime}
                onChange={(e) => updateCurrentProduct({ productionTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(3)}
              className="py-3 px-6 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 py-3 px-6 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Generate AI Catalog</span>
              <span className="material-symbols-outlined">auto_awesome</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: AI CATALOG PREVIEW */}
      {step === 5 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-primary">auto_stories</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 5: Multilingual AI Catalog</h2>
            <p className="text-sm text-on-surface-variant">AI-generated product story in English and Vernacular Hindi.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 space-y-2">
              <span className="text-xs font-bold text-tertiary uppercase">English Buyer Story</span>
              <textarea
                rows={3}
                value={currentProduct.descriptionEnglish}
                onChange={(e) => updateCurrentProduct({ descriptionEnglish: e.target.value })}
                className="w-full p-3 bg-surface-bright border rounded-xl text-sm leading-relaxed"
              />
            </div>

            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40 space-y-2">
              <span className="text-xs font-bold text-primary uppercase">Hindi Vernacular Story (हिंदी विवरण)</span>
              <textarea
                rows={3}
                value={currentProduct.descriptionHindi}
                onChange={(e) => updateCurrentProduct({ descriptionHindi: e.target.value })}
                className="w-full p-3 bg-surface-bright border rounded-xl text-sm leading-relaxed font-medium"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(4)}
              className="py-3 px-6 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
            >
              Back
            </button>
            <button
              onClick={() => setStep(6)}
              className="flex-1 py-3 px-6 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Continue to Pricing Assistant</span>
              <span className="material-symbols-outlined">payments</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: PRICING ASSISTANT */}
      {step === 6 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-tertiary pulse-animation">smart_toy</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 6: AI Pricing Assistant</h2>
            <p className="text-sm text-on-surface-variant">We're here to help you value your craft fairly so your effort is rewarded.</p>
          </div>

          {/* AI Suggested Price Card */}
          <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/50 soft-shadow text-center space-y-3">
            <span className="text-xs font-bold text-tertiary uppercase tracking-wider bg-tertiary-fixed px-3 py-1 rounded-full">
              AI Market Recommendation
            </span>
            <div className="text-4xl font-bold text-primary font-display-lg">
              ₹{currentProduct.aiSuggestedPrice || 1850}
            </div>
            <p className="text-xs text-on-surface-variant">
              Recommended range: <strong className="text-on-surface">₹{currentProduct.priceRange?.min || 1600} – ₹{currentProduct.priceRange?.max || 2100}</strong>
            </p>
          </div>

          {/* Cost breakdown */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-on-surface text-sm mb-2">Cost Breakdown Estimate</h4>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Raw Material Cost:</span>
              <span className="font-semibold">₹{currentProduct.materialCost || 700}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Labor Effort ({currentProduct.productionTime}):</span>
              <span className="font-semibold">₹500</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold text-primary text-sm">
              <span>Estimated Production Cost:</span>
              <span>₹{(currentProduct.materialCost || 700) + 500}</span>
            </div>
          </div>

          {/* Artisan Final Price Choice */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Set Your Final Selling Price (₹)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={currentProduct.finalPrice}
                onChange={(e) => updateCurrentProduct({ finalPrice: Number(e.target.value) })}
                className="flex-1 px-4 py-3 bg-surface-container-low border-2 border-primary rounded-xl text-lg font-bold text-primary outline-none"
              />
              <button
                type="button"
                onClick={() => updateCurrentProduct({ finalPrice: currentProduct.aiSuggestedPrice })}
                className="px-4 py-3 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-xl border border-outline-variant"
              >
                Accept AI Price (₹{currentProduct.aiSuggestedPrice})
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(5)}
              className="py-3 px-6 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
            >
              Back
            </button>
            <button
              onClick={() => setStep(7)}
              className="flex-1 py-3 px-6 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Save Price & Set Inventory</span>
              <span className="material-symbols-outlined">inventory</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: INVENTORY SETUP */}
      {step === 7 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-primary">inventory_2</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 7: Inventory & Wholesale Terms</h2>
            <p className="text-sm text-on-surface-variant">Specify available stock and bulk order capabilities.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Available Stock Quantity
              </label>
              <input
                type="number"
                value={currentProduct.quantity}
                onChange={(e) => updateCurrentProduct({ quantity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                Minimum Bulk Order Quantity
              </label>
              <input
                type="number"
                value={currentProduct.minBulkOrder}
                onChange={(e) => updateCurrentProduct({ minBulkOrder: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-on-surface text-sm">Made to Order Available</h4>
              <p className="text-xs text-on-surface-variant">Allow buyers to place custom/bulk pre-orders</p>
            </div>
            <input
              type="checkbox"
              checked={currentProduct.madeToOrder}
              onChange={(e) => updateCurrentProduct({ madeToOrder: e.target.checked })}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(6)}
              className="py-3 px-6 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
            >
              Back
            </button>
            <button
              onClick={() => setStep(8)}
              className="flex-1 py-3 px-6 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Go to Final Preview</span>
              <span className="material-symbols-outlined">preview</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: FINAL PREVIEW & PUBLISH */}
      {step === 8 && (
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl soft-shadow border border-surface-variant space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-tertiary">check_circle</span>
            <h2 className="text-2xl font-bold text-on-surface">Step 8: Final Listing Preview</h2>
            <p className="text-sm text-on-surface-variant">Review all collected data before publishing to marketplace.</p>
          </div>

          {/* Product Preview Card */}
          <div className="border border-outline-variant rounded-2xl overflow-hidden bg-surface-bright grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
            <div className="h-64 rounded-xl overflow-hidden bg-surface-dim">
              <img src={currentProduct.enhancedImage || currentProduct.image} alt={currentProduct.title} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-tertiary uppercase bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
                  {currentProduct.category}
                </span>
                <span className="text-2xl font-bold text-primary font-display-lg">₹{currentProduct.finalPrice}</span>
              </div>

              <h3 className="text-xl font-bold text-on-surface">{currentProduct.title}</h3>
              <p className="text-xs text-on-surface-variant italic">"{currentProduct.titleHindi}"</p>
              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                {currentProduct.descriptionEnglish}
              </p>

              <div className="text-xs space-y-1 pt-2 border-t text-on-surface-variant">
                <p><strong>Material:</strong> {currentProduct.material}</p>
                <p><strong>Craft:</strong> {currentProduct.craft}</p>
                <p><strong>Stock Quantity:</strong> {currentProduct.quantity} units</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(7)}
              className="py-3 px-6 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container"
            >
              Back
            </button>
            <button
              onClick={handlePublish}
              className="flex-1 py-4 px-6 bg-primary text-on-primary font-bold text-base rounded-2xl hover:bg-surface-tint active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
              <span>Publish Product to Marketplace</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: PUBLISHED SUCCESS */}
      {step === 9 && (
        <div className="bg-surface-container-lowest p-8 sm:p-12 rounded-3xl soft-shadow border border-surface-variant text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-5xl">task_alt</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-on-surface font-display-lg">Your Product is Live!</h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Congratulations! Your product page has been created with AI-enhanced photos, fair pricing, and vernacular descriptions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to={`/marketplace/product/${currentProduct.publishedId || 'prod-1'}`}
              className="py-3.5 px-6 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">visibility</span>
              <span>View Product Details</span>
            </Link>

            <Link
              to="/artisan/store"
              className="py-3.5 px-6 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-sm rounded-xl transition-all border border-outline-variant flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">storefront</span>
              <span>View My Digital Store</span>
            </Link>
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                resetCurrentProduct();
                setStep(1);
              }}
              className="text-xs text-tertiary font-bold hover:underline"
            >
              + Add Another Product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductFlow;
