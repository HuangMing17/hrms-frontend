"use client"

import { useState } from "react"
import { Upload, FileText, Loader2, Sparkles, CheckCircle, AlertCircle, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { AnimatedButton } from "./ui/animated-button"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Alert, AlertDescription } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { ScrollArea } from "./ui/scroll-area"
import { Gender, MaritalStatus, CreateEmployeeRequest } from "../lib/api/employee"

interface CVParseResult {
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    address: string | null
    birthDate: string | null
    nationalId: string | null
    gender: Gender | null
    maritalStatus: MaritalStatus | null
    educationLevel: string | null
    educationMajor: string | null
    educationSchool: string | null
    educationGraduationYear: number | null
    yearsOfExperience: number | null
    previousExperience: Array<{
        company: string
        position: string
        duration: string
        description: string
    }> | null
    skills: string[] | null
    languages: Array<{
        language: string
        level: string
    }> | null
    certifications: string[] | null
    bio: string | null
    linkedinUrl: string | null
    portfolioUrl: string | null
    confidence: number
}

interface CVParserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onParseSuccess: (parsedData: CreateEmployeeRequest) => void
}

export function CVParserDialog({ open, onOpenChange, onParseSuccess }: CVParserDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [parsing, setParsing] = useState(false)
    const [parsedData, setParsedData] = useState<CVParseResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setParsedData(null)
            setError(null)

            // Create preview URL
            if (selectedFile.type.startsWith('image/')) {
                const url = URL.createObjectURL(selectedFile)
                setPreviewUrl(url)
            } else {
                setPreviewUrl(null)
            }
        }
    }

    const handleParse = async () => {
        if (!file) return

        setParsing(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/employees/parse-cv`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to parse CV" }))
                throw new Error(errorData.message || "Failed to parse CV")
            }

            const result = await response.json()
            setParsedData(result.data)
        } catch (err: any) {
            setError(err.message || "Không thể phân tích CV. Vui lòng thử lại.")
        } finally {
            setParsing(false)
        }
    }

    const handleUseParsedData = () => {
        if (!parsedData) return

        // Convert CVParseResult to CreateEmployeeRequest
        const createRequest: CreateEmployeeRequest = {
            firstName: parsedData.firstName || "",
            lastName: parsedData.lastName || "",
            email: parsedData.email || "",
            phone: parsedData.phone || undefined,
            address: parsedData.address || undefined,
            birthDate: parsedData.birthDate || undefined,
            nationalId: parsedData.nationalId || undefined,
            gender: parsedData.gender || undefined,
            maritalStatus: parsedData.maritalStatus || undefined,
            hireDate: new Date().toISOString().split('T')[0], // Default to today
            status: undefined, // Will use default
            // CV fields
            educationLevel: parsedData.educationLevel || undefined,
            educationMajor: parsedData.educationMajor || undefined,
            educationSchool: parsedData.educationSchool || undefined,
            educationGraduationYear: parsedData.educationGraduationYear || undefined,
            yearsOfExperience: parsedData.yearsOfExperience || undefined,
            previousExperience: parsedData.previousExperience ? JSON.stringify(parsedData.previousExperience) : undefined,
            skills: parsedData.skills ? JSON.stringify(parsedData.skills) : undefined,
            languages: parsedData.languages ? JSON.stringify(parsedData.languages) : undefined,
            certifications: parsedData.certifications ? JSON.stringify(parsedData.certifications) : undefined,
            bio: parsedData.bio || undefined,
            linkedinUrl: parsedData.linkedinUrl || undefined,
            portfolioUrl: parsedData.portfolioUrl || undefined,
        }

        onParseSuccess(createRequest)
        handleClose()
    }

    const handleClose = () => {
        setFile(null)
        setParsedData(null)
        setError(null)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        onOpenChange(false)
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Đọc CV tự động với AI
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Upload Section */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="cv-file">Chọn file CV (JPG, PNG, PDF)</Label>
                                    <Input
                                        id="cv-file"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        disabled={parsing}
                                        className="mt-2"
                                    />
                                    {file && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Đã chọn: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </p>
                                    )}
                                </div>

                                {previewUrl && (
                                    <div className="mt-4">
                                        <Label>Xem trước</Label>
                                        <div className="mt-2 border rounded-lg overflow-hidden">
                                            <img
                                                src={previewUrl}
                                                alt="CV Preview"
                                                className="w-full h-auto max-h-96 object-contain"
                                            />
                                        </div>
                                    </div>
                                )}

                                <AnimatedButton
                                    onClick={handleParse}
                                    disabled={!file || parsing}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                                >
                                    {parsing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang phân tích CV...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Phân tích CV với AI
                                        </>
                                    )}
                                </AnimatedButton>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Parsed Data Preview */}
                    {parsedData && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Thông tin đã trích xuất</h3>
                                        <Badge className={getConfidenceColor(parsedData.confidence)}>
                                            Độ tin cậy: {(parsedData.confidence * 100).toFixed(0)}%
                                        </Badge>
                                    </div>

                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-4">
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Họ</Label>
                                                    <p className="font-medium">{parsedData.lastName || "Chưa có"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Tên</Label>
                                                    <p className="font-medium">{parsedData.firstName || "Chưa có"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                                    <p className="font-medium">{parsedData.email || "Chưa có"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Điện thoại</Label>
                                                    <p className="font-medium">{parsedData.phone || "Chưa có"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Ngày sinh</Label>
                                                    <p className="font-medium">{parsedData.birthDate || "Chưa có"}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground">Giới tính</Label>
                                                    <p className="font-medium">
                                                        {parsedData.gender === Gender.MALE ? "Nam" :
                                                         parsedData.gender === Gender.FEMALE ? "Nữ" :
                                                         parsedData.gender === Gender.OTHER ? "Khác" : "Chưa có"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Education */}
                                            {(parsedData.educationLevel || parsedData.educationMajor || parsedData.educationSchool) && (
                                                <div>
                                                    <Label className="text-sm font-semibold">Học vấn</Label>
                                                    <div className="mt-2 space-y-1">
                                                        {parsedData.educationLevel && (
                                                            <p><span className="text-muted-foreground">Trình độ:</span> {parsedData.educationLevel}</p>
                                                        )}
                                                        {parsedData.educationMajor && (
                                                            <p><span className="text-muted-foreground">Chuyên ngành:</span> {parsedData.educationMajor}</p>
                                                        )}
                                                        {parsedData.educationSchool && (
                                                            <p><span className="text-muted-foreground">Trường:</span> {parsedData.educationSchool}</p>
                                                        )}
                                                        {parsedData.educationGraduationYear && (
                                                            <p><span className="text-muted-foreground">Năm tốt nghiệp:</span> {parsedData.educationGraduationYear}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Experience */}
                                            {parsedData.yearsOfExperience !== null && (
                                                <div>
                                                    <Label className="text-sm font-semibold">Kinh nghiệm</Label>
                                                    <p className="mt-1">{parsedData.yearsOfExperience} năm</p>
                                                </div>
                                            )}

                                            {/* Skills */}
                                            {parsedData.skills && parsedData.skills.length > 0 && (
                                                <div>
                                                    <Label className="text-sm font-semibold">Kỹ năng</Label>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {parsedData.skills.map((skill, idx) => (
                                                            <Badge key={idx} variant="secondary">{skill}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Languages */}
                                            {parsedData.languages && parsedData.languages.length > 0 && (
                                                <div>
                                                    <Label className="text-sm font-semibold">Ngôn ngữ</Label>
                                                    <div className="mt-2 space-y-1">
                                                        {parsedData.languages.map((lang, idx) => (
                                                            <p key={idx}>
                                                                <span className="font-medium">{lang.language}</span>
                                                                {lang.level && <span className="text-muted-foreground ml-2">({lang.level})</span>}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Certifications */}
                                            {parsedData.certifications && parsedData.certifications.length > 0 && (
                                                <div>
                                                    <Label className="text-sm font-semibold">Chứng chỉ</Label>
                                                    <div className="mt-2 space-y-1">
                                                        {parsedData.certifications.map((cert, idx) => (
                                                            <p key={idx}>• {cert}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bio */}
                                            {parsedData.bio && (
                                                <div>
                                                    <Label className="text-sm font-semibold">Tóm tắt</Label>
                                                    <p className="mt-1 text-sm text-muted-foreground">{parsedData.bio}</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>

                                    <div className="flex gap-2 pt-4 border-t">
                                        <AnimatedButton
                                            variant="outline"
                                            onClick={handleClose}
                                            className="flex-1"
                                        >
                                            Hủy
                                        </AnimatedButton>
                                        <AnimatedButton
                                            onClick={handleUseParsedData}
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Sử dụng dữ liệu này
                                        </AnimatedButton>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

